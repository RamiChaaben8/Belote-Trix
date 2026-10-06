"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { emitAck, getSocket } from "@/socket/client";
import { useSettings } from "@/hooks/useSettings";
import { playSound } from "@/lib/sound";
import type { CardData, GameType, ModeId, Move } from "@/types";

export interface SeatView {
  seat: number;
  name: string;
  isBot: boolean;
  connected: boolean;
  avatar: string;
  isHost: boolean;
}

export interface RoomView {
  code: string;
  status: "lobby" | "playing" | "finished";
  isHost: boolean;
  difficulty: "easy" | "medium" | "hard";
  gameType: GameType;
  quickMode: ModeId;
  you: number | null;
  seats: (SeatView | null)[];
  spectators: number;
  phase: "lobby" | "selecting" | "playing" | "finished";
  selector: number | null;
  used: string[][];
  modes: string[];
  remaining: string[];
  roundNumber: number;
  totalRounds: number;
  totals: number[];
  actor: number | null;
  hand: CardData[];
  legal: Move[];
  handCounts: number[];
  dealer: number | null;
  leader: number | null;
  stats: {
    modesWon: number;
    tricksWon: number;
    diamonds: number;
    queens: number;
    kingHearts: number;
    fiftyOneWins: number;
    turnsTricksWon: number;
    lastTrickWins: number;
    trixWins: number;
  }[] | null;
  round: {
    mode: string;
    trick: { seat: number; card: CardData }[];
    broken: boolean;
    scores: number[];
    total: number;
    direction: 1 | -1;
    tricks: { index: number; winner: number; points: number; plays: { seat: number; card: CardData }[] }[];
    fiftyMoves?: {
      seat: number;
      card: CardData;
      delta: number;
      prevTotal: number;
      newTotal: number;
      aceValue: 1 | 11 | null;
    }[];
    trixTable?: {
      H: { low: number; high: number } | null;
      D: { low: number; high: number } | null;
      C: { low: number; high: number } | null;
      S: { low: number; high: number } | null;
    } | null;
    trixFinishOrder?: number[];
  } | null;
  thinkingSeats?: number[];
  history: {
    number: number;
    mode: string;
    selector: number;
    endReason: string | null;
    base: number[];
    multipliers: number[];
    scores: number[];
  }[];
  lastRoundResult: {
    number: number;
    mode: string;
    selector: number;
    endReason: string | null;
    base: number[];
    multipliers: number[];
    scores: number[];
  } | null;
  chat: ChatEntry[];
}

export interface ChatEntry {
  author: string;
  seat: number | null;
  content: string;
  at: number;
}

export interface LastTrick {
  winner: number;
  points: number;
  plays: { seat: number; card: CardData }[];
}

export interface RoundFinishedPayload {
  roundNumber: number;
  mode: string;
  selector: number;
  endReason: string | null;
  base: number[];
  multipliers: number[];
  scores: number[];
}

export function useRoom(code: string) {
  const { sound } = useSettings();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [room, setRoom] = useState<RoomView | null>(null);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastTrick, setLastTrick] = useState<LastTrick | null>(null);
  const [roundFinished, setRoundFinished] = useState<RoundFinishedPayload | null>(null);
  /** Fires immediately when round_finished arrives — shows the objective banner during animation */
  const [roundBanner, setRoundBanner] = useState<RoundFinishedPayload | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  /** Trix: seat that just got an Ace extra-turn (shown briefly as a banner). */
  const [trixExtraTurnSeat, setTrixExtraTurnSeat] = useState<number | null>(null);
  const yourSeat = useRef<number | null>(null);

  useEffect(() => {
    const s = getSocket();
    let trickTimer: ReturnType<typeof setTimeout>;
    const flash = (msg: string) => {
      setNotice(msg);
      setTimeout(() => setNotice(null), 3500);
    };

    const join = async () => {
      setConnected(true);
      const res = await emitAck("join_room", { code });
      if (!res.ok) setError(res.error ?? "Unable to join room");
      else setError(null);
    };
    const onState = (v: RoomView | null) => {
      if (!v) return;
      yourSeat.current = v.you;
      setRoom((prev) => {
        if (prev && v.actor === v.you && v.actor !== null && prev.actor !== v.actor) playSound("turn", soundRef.current);
        if (!prev || prev.chat.length === 0) setChat(v.chat);
        return v;
      });
    };
    const onChat = (m: ChatEntry) => {
      setChat((c) => [...c, m].slice(-100));
      playSound("chat", soundRef.current);
    };
    const onCard = () => playSound("play", soundRef.current);
    const onTrick = (t: LastTrick) => {
      setLastTrick(t);
      clearTimeout(trickTimer);
      // Keep last trick visible for 3s so LastPlayPanel shows during round-end delay
      trickTimer = setTimeout(() => setLastTrick(null), 3000);
    };
    let roundFinishedTimer: ReturnType<typeof setTimeout>;
    const onRoundFinished = (payload: RoundFinishedPayload) => {
      // Show the objective banner immediately so players see it during the trick animation.
      setRoundBanner(payload);
      // In FiftyOne mode, wait 3 seconds for winner/loser display before showing summary modal.
      // In trick modes, delay 2.5s so the trick animation (1.5s glow + 0.65s collect) plays out.
      const delay = payload.mode === "FiftyOne" ? 3200 : 2500;
      clearTimeout(roundFinishedTimer);
      roundFinishedTimer = setTimeout(() => {
        setRoundBanner(null);
        setRoundFinished(payload);
      }, delay);
    };
    const onDeal = () => playSound("deal", soundRef.current);
    const onFinished = () => playSound("win", soundRef.current);
    const onSaved = (d: { gameId: string | null }) => setGameId(d.gameId);
    const onBroken = (d: { suit: string }) => flash(`${d.suit === "H" ? "Hearts" : "Diamonds"} are now broken!`);
    const onDisc = (d: { seat: number }) => flash(`Seat ${d.seat + 1} disconnected - a bot will cover after 15s`);
    const onRecon = () => flash("A player reconnected");
    const onTrixExtra = (d: { seat: number }) => {
      setTrixExtraTurnSeat(d.seat);
      setTimeout(() => setTrixExtraTurnSeat(null), 2000);
    };

    s.on("connect", join);
    s.on("disconnect", () => setConnected(false));
    s.on("room_state", onState);
    s.on("chat_message", onChat);
    s.on("card_played", onCard);
    s.on("trick_finished", onTrick);
    s.on("round_finished", onRoundFinished);
    s.on("deal_cards", onDeal);
    s.on("game_finished", onFinished);
    s.on("game_saved", onSaved);
    s.on("suit_broken", onBroken);
    s.on("player_disconnected", onDisc);
    s.on("player_reconnected", onRecon);
    s.on("trix_extra_turn", onTrixExtra);
    if (s.connected) void join();
    return () => {
      clearTimeout(trickTimer);
      clearTimeout(roundFinishedTimer);
      s.off("connect", join);
      s.off("room_state", onState);
      s.off("chat_message", onChat);
      s.off("card_played", onCard);
      s.off("trick_finished", onTrick);
      s.off("round_finished", onRoundFinished);
      s.off("deal_cards", onDeal);
      s.off("game_finished", onFinished);
      s.off("game_saved", onSaved);
      s.off("suit_broken", onBroken);
      s.off("player_disconnected", onDisc);
      s.off("player_reconnected", onRecon);
      s.off("trix_extra_turn", onTrixExtra);
    };
  }, [code]);

  const act = useCallback(async (event: string, payload: unknown = {}) => {
    const res = await emitAck(event, payload);
    if (!res.ok) {
      setError(res.error ?? "Action failed");
      setTimeout(() => setError(null), 3000);
    }
    return res;
  }, []);

  return { room, chat, error, connected, lastTrick, roundFinished, setRoundFinished, roundBanner, notice, gameId, trixExtraTurnSeat, act };
}
