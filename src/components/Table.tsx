"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardFan } from "@/components/CardFan";
import { OpponentHand } from "@/components/OpponentHand";
import { PlayerPod } from "@/components/PlayerPod";
import { CenterTrick } from "@/components/CenterTrick";
import { ScoreboardPanel } from "@/components/ScoreboardPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { RoundSummaryModal } from "@/components/RoundSummaryModal";
import { FinalResultsModal } from "@/components/FinalResultsModal";
import type { LastTrick, RoomView, ChatEntry } from "@/hooks/useRoom";
import type { CardData, Move, ModeId } from "@/types";

type Act = (event: string, payload?: unknown) => Promise<unknown>;

const POS = ["bottom", "left", "top", "right"] as const;

export function Table({
  room,
  lastTrick,
  chat,
  act,
  gameId,
}: {
  room: RoomView;
  lastTrick: LastTrick | null;
  chat?: ChatEntry[];
  act: Act;
  gameId: string | null;
}) {
  const me = room.you ?? 0;
  const rel = (seat: number) => (seat - me + 4) % 4;

  const [aceFor, setAceFor] = useState<CardData | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [dismissedRoundNumber, setDismissedRoundNumber] = useState<number>(0);
  const [isCollecting, setIsCollecting] = useState(false);

  const round = room.round;
  const myTurn = room.you !== null && room.actor === room.you;
  const isSelector = room.phase === "selecting" && room.selector === room.you;
  const name = (s: number) => room.seats[s]?.name ?? `Seat ${s + 1}`;

  // 2-second glow and celebration on winning card before collecting
  useEffect(() => {
    if (lastTrick) {
      setIsCollecting(false);
      const timer = setTimeout(() => {
        setIsCollecting(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsCollecting(false);
    }
  }, [lastTrick]);

  const legalFor = (c: CardData): Move[] =>
    room.legal.filter((m) => m.card.suit === c.suit && m.card.rank === c.rank);

  const handleCardClick = (c: CardData) => {
    const moves = legalFor(c);
    if (!moves.length || !myTurn) return;

    setSelectedCard(c);
    if (moves.length > 1) {
      setAceFor(c);
    } else {
      setAceFor(null);
      void act("play_card", moves[0]);
      setTimeout(() => setSelectedCard(null), 350);
    }
  };

  // Center trick cards
  const centerPlays =
    lastTrick && (!round || round.trick.length === 0)
      ? lastTrick.plays
      : round?.trick ?? [];

  const winningSeat = lastTrick ? lastTrick.winner : null;
  const winningPlayerName = lastTrick ? name(lastTrick.winner) : null;

  // Round summary popup at end of round
  const latestRoundResult = room.history.length
    ? room.history[room.history.length - 1]
    : null;

  const showRoundSummary =
    latestRoundResult &&
    dismissedRoundNumber < latestRoundResult.number &&
    (room.phase === "selecting" || room.phase === "finished");

  const currentMode =
    round?.mode ??
    (room.history.length ? room.history[room.history.length - 1].mode : "");

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] min-h-[640px] max-h-[1050px] flex flex-col justify-between items-center select-none overflow-hidden">
      {/* ======================================================== */}
      {/* TOP HEADER OVERLAY BAR: SCOREBOARD (LEFT) & CHAT (RIGHT) */}
      {/* ======================================================== */}
      <div className="w-full flex items-start justify-between px-3 pt-2 pointer-events-none z-30">
        {/* TOP LEFT: COMPACT SCOREBOARD PANEL */}
        <div className="pointer-events-auto">
          <ScoreboardPanel
            roundNumber={Math.min(
              room.roundNumber + (room.phase === "selecting" ? 1 : 0),
              room.totalRounds
            )}
            totalRounds={room.totalRounds}
            mode={currentMode}
            selectorName={room.selector !== null ? name(room.selector) : "—"}
            seats={[0, 1, 2, 3].map((seat) => ({
              seat,
              name: name(seat),
              avatar: room.seats[seat]?.avatar ?? "🙂",
              total: room.totals[seat],
              isYou: seat === me,
            }))}
          />
        </div>

        {/* TOP RIGHT: COMPACT COLLAPSIBLE CHAT PANEL */}
        <div className="pointer-events-auto">
          <ChatPanel
            chat={chat ?? room.chat ?? []}
            onSend={(content) => void act("chat_message", { content })}
            onlineCount={room.seats.filter((s) => s && s.connected).length}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* CENTER: ENLARGED POKER TABLE (DOMINATES SCREEN)          */}
      {/* ======================================================== */}
      <div className="relative flex-1 w-full max-w-6xl px-1 sm:px-4 flex items-center justify-center -my-2">
        <div
          data-testid="poker-table"
          className="relative flex items-center justify-center w-full h-[76vh] max-h-[620px] rounded-[5rem] sm:rounded-[7.5rem] border-[12px] sm:border-[20px] border-amber-950/95 shadow-[0_35px_80px_rgba(0,0,0,0.95),inset_0_0_100px_rgba(0,0,0,0.75)]"
          style={{
            background:
              "radial-gradient(ellipse at center, #13734a 0%, #0d5435 45%, #083722 80%, #031c11 100%)",
          }}
        >
          {/* Elegant gold inner accent ring with subtle casino felt lighting */}
          <div className="absolute inset-2 sm:inset-4 rounded-[4.2rem] sm:rounded-[6.2rem] border-2 border-amber-400/40 shadow-[inset_0_0_35px_rgba(251,191,36,0.18)] pointer-events-none" />

          {/* Broken Suits indicator in corner of table */}
          {round && (round.mode === "KingOfHearts" || round.mode === "Diamonds") && (
            <div className="absolute top-5 right-10 z-10 hidden sm:flex items-center gap-1.5 text-[11px]">
              <span
                className={`px-2.5 py-0.5 rounded-full border shadow-md ${
                  round.broken
                    ? "bg-rose-950/90 border-rose-400 text-rose-300 font-bold"
                    : "bg-slate-900/80 border-slate-700 text-slate-400"
                }`}
              >
                {round.mode === "KingOfHearts" ? "♥ Hearts" : "♦ Diamonds"}:{" "}
                {round.broken ? "Broken" : "Locked"}
              </span>
            </div>
          )}

          {/* 4 PLAYERS POSITIONED MINIMALLY AROUND TABLE */}
          {room.seats.map((seatData, seatIdx) => {
            if (!seatData) return null;
            const position = POS[rel(seatIdx)];
            const isTurn = room.actor === seatIdx && room.phase !== "finished";
            const isDealer = room.dealer === seatIdx;
            const isRoundSelector = room.selector === seatIdx;
            const count = room.handCounts[seatIdx] ?? 0;

            return (
              <div
                key={seatIdx}
                data-testid={`seat-${seatIdx}`}
                className={`absolute z-20 flex flex-col items-center ${
                  position === "bottom"
                    ? "bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2"
                    : position === "top"
                    ? "top-2 sm:top-3 left-1/2 -translate-x-1/2"
                    : position === "left"
                    ? "left-2 sm:left-4 top-1/2 -translate-y-1/2"
                    : "right-2 sm:right-4 top-1/2 -translate-y-1/2"
                }`}
              >
                <PlayerPod
                  seat={seatIdx}
                  name={seatData.name}
                  avatar={seatData.avatar}
                  totalScore={room.totals[seatIdx]}
                  isBot={seatData.isBot}
                  connected={seatData.connected}
                  isCurrentTurn={isTurn}
                  isDealer={isDealer}
                  isSelector={isRoundSelector}
                  cardCount={count}
                  position={position}
                />

                {/* Opponents' Card Backs */}
                {position !== "bottom" && room.phase !== "finished" && (
                  <div
                    className={`pointer-events-none ${
                      position === "left"
                        ? "absolute left-full top-1/2 -translate-y-1/2 ml-2"
                        : position === "right"
                        ? "absolute right-full top-1/2 -translate-y-1/2 mr-2"
                        : "mt-1"
                    }`}
                  >
                    <OpponentHand cardCount={count} position={position} />
                  </div>
                )}
              </div>
            );
          })}

          {/* ======================================================== */}
          {/* CENTER OF TABLE: DUAL STATE (MODE SELECTION / TRICKS)   */}
          {/* ======================================================== */}
          <div className="absolute inset-0 flex items-center justify-center z-15">
            <CenterTrick
              isSelectingMode={room.phase === "selecting"}
              isCurrentUserSelector={isSelector}
              selectorName={room.selector !== null ? name(room.selector) : ""}
              remainingModes={(room.remaining as ModeId[]) ?? []}
              onSelectMode={(m) => void act("select_mode", { mode: m })}
              plays={centerPlays}
              youSeat={me}
              winnerSeat={winningSeat}
              winnerName={winningPlayerName}
              mode={currentMode}
              fiftyTotal={round?.mode === "FiftyOne" ? round.total : undefined}
              fiftyDirection={round?.direction}
              isCollecting={isCollecting}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM: USER HAND OF CARDS                               */}
      {/* ======================================================== */}
      <div className="w-full flex flex-col items-center justify-end z-25 pb-1 sm:pb-2">
        {/* Ace choice popup for Fifty One mode */}
        {aceFor && myTurn && (
          <div className="flex items-center justify-center gap-3 p-2.5 bg-slate-950/95 border-2 border-amber-400 rounded-2xl mb-1 shadow-2xl z-30">
            <span className="text-xs sm:text-sm font-black text-amber-300">
              Play Ace as:
            </span>
            {legalFor(aceFor).map((m) => (
              <Button
                key={m.aceValue}
                size="sm"
                data-testid={`ace-${m.aceValue}`}
                onClick={() => {
                  setAceFor(null);
                  setSelectedCard(null);
                  void act("play_card", m);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 font-black px-4 py-1 text-sm shadow-md"
              >
                +{m.aceValue}
              </Button>
            ))}
          </div>
        )}

        {/* Turn prompt chip */}
        {room.you !== null && room.phase !== "finished" && (
          <div className="flex items-center gap-2 mb-0.5">
            <span
              data-testid="turn-hint"
              className={`text-xs sm:text-sm font-black px-4 py-0.5 rounded-full shadow-lg ${
                myTurn
                  ? "bg-amber-400 text-slate-950 animate-pulse border border-yellow-200"
                  : "bg-slate-900/90 text-slate-300 border border-slate-700"
              }`}
            >
              {myTurn
                ? room.phase === "selecting"
                  ? "Select a mode in the center of the table!"
                  : "Your turn! Click a highlighted card to play"
                : room.actor !== null
                ? `Waiting for ${name(room.actor)}…`
                : ""}
            </span>
          </div>
        )}

        {/* Realistic Flat Card Fan */}
        {room.you !== null && room.phase !== "finished" && (
          <div data-testid="hand" className="w-full flex justify-center">
            <CardFan
              cards={room.hand}
              legalMoves={room.legal}
              isMyTurn={myTurn}
              selectedCard={selectedCard}
              onCardClick={handleCardClick}
              disabled={!myTurn}
            />
          </div>
        )}

        {room.you === null && (
          <p className="text-center text-xs text-slate-400 py-2">
            You are spectating this match.
          </p>
        )}
      </div>

      {/* ======================================================== */}
      {/* ROUND END BREAKDOWN MODAL                                */}
      {/* ======================================================== */}
      {showRoundSummary && latestRoundResult && (
        <RoundSummaryModal
          roundNumber={latestRoundResult.number}
          mode={latestRoundResult.mode}
          selectorSeat={latestRoundResult.selector}
          players={room.seats.map((s, idx) => ({
            seat: idx,
            name: s?.name ?? `Seat ${idx + 1}`,
            avatar: s?.avatar ?? "🙂",
          }))}
          baseScores={latestRoundResult.base}
          multipliers={latestRoundResult.multipliers}
          finalScores={latestRoundResult.scores}
          onContinue={() => setDismissedRoundNumber(latestRoundResult.number)}
        />
      )}

      {/* ======================================================== */}
      {/* FINAL MATCH RESULTS SCREEN (LOWEST SCORE WINS)           */}
      {/* ======================================================== */}
      {room.phase === "finished" && (
        <FinalResultsModal
          players={room.seats.map((s, idx) => ({
            seat: idx,
            name: s?.name ?? `Seat ${idx + 1}`,
            avatar: s?.avatar ?? "🙂",
          }))}
          totals={room.totals}
          stats={room.stats}
          replayId={gameId}
          onPlayAgain={() => (window.location.href = "/")}
        />
      )}
    </div>
  );
}
