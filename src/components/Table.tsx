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
import { LastPlayPanel } from "@/components/LastPlayPanel";
import { ObjectiveBanner } from "@/components/ObjectiveBanner";
import type { LastTrick, RoomView, ChatEntry, RoundFinishedPayload } from "@/hooks/useRoom";
import type { CardData, Move, ModeId } from "@/types";

type Act = (event: string, payload?: unknown) => Promise<unknown>;

const POS = ["bottom", "left", "top", "right"] as const;

export function Table({
  room,
  lastTrick,
  roundFinished,
  roundBanner,
  onRoundDismissed,
  chat,
  act,
  gameId,
}: {
  room: RoomView;
  lastTrick: LastTrick | null;
  /** Live payload from the `round_finished` socket event — non-null while modal should show. */
  roundFinished: RoundFinishedPayload | null;
  /** Immediate banner shown during trick collection animation, before the full modal. */
  roundBanner: RoundFinishedPayload | null;
  /** Called when the user clicks "Continue" on the round summary modal. */
  onRoundDismissed: () => void;
  chat?: ChatEntry[];
  act: Act;
  gameId: string | null;
}) {
  const me = room.you ?? 0;
  const rel = (seat: number) => (seat - me + 4) % 4;

  const [aceFor, setAceFor] = useState<CardData | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const round = room.round;
  const name = (s: number) => room.seats[s]?.name ?? `Seat ${s + 1}`;

  // Block card plays while the round-summary modal OR the objective banner is showing.
  const modalOpen = roundFinished !== null || roundBanner !== null;
  const myTurn = !modalOpen && room.you !== null && room.actor === room.you;
  const isSelector = !modalOpen && room.phase === "selecting" && room.selector === room.you;

  // 1.5-second trick glow then collect animation
  useEffect(() => {
    if (lastTrick) {
      setIsCollecting(false);
      const timer = setTimeout(() => setIsCollecting(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsCollecting(false);
    }
  }, [lastTrick]);

  const legalFor = (c: CardData): Move[] =>
    room.legal.filter((m) => m.card.suit === c.suit && m.card.rank === c.rank);

  const handleCardClick = (c: CardData) => {
    if (modalOpen) return; // hard block while result modal is open
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

  const currentMode =
    round?.mode ??
    (room.history.length ? room.history[room.history.length - 1].mode : "");

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] min-h-[640px] max-h-[1050px] flex flex-col justify-between items-center select-none overflow-hidden">

      {/* FIXED SCOREBOARD */}
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

      {/* FLOATING CHAT */}
      <ChatPanel
        chat={chat ?? room.chat ?? []}
        onSend={(content) => void act("chat_message", { content })}
        onlineCount={room.seats.filter((s) => s && s.connected).length}
      />

      {/* CENTER: POKER TABLE */}
      <div className="relative flex-1 w-full max-w-5xl px-1 sm:px-3 flex items-center justify-center">
        <div
          data-testid="poker-table"
          className="relative flex items-center justify-center w-full rounded-[5rem] sm:rounded-[7rem] border-[12px] sm:border-[18px] border-amber-950/95 shadow-[0_35px_80px_rgba(0,0,0,0.95),inset_0_0_100px_rgba(0,0,0,0.75)]"
          style={{
            height: "clamp(340px, calc(100vh - 320px), 580px)",
            background:
              "radial-gradient(ellipse at center, #13734a 0%, #0d5435 45%, #083722 80%, #031c11 100%)",
          }}
        >
          <div className="absolute inset-2 sm:inset-4 rounded-[4.2rem] sm:rounded-[6.2rem] border-2 border-amber-400/40 shadow-[inset_0_0_35px_rgba(251,191,36,0.18)] pointer-events-none" />

          {/* Broken Suits indicator */}
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

          {/* 4 PLAYERS */}
          {room.seats.map((seatData, seatIdx) => {
            if (!seatData) return null;
            const position = POS[rel(seatIdx)];
            const isTurn = !modalOpen && room.actor === seatIdx && room.phase !== "finished";
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

          {/* CENTER: MODE SELECTION / TRICK AREA */}
          <div className="absolute inset-0 flex items-center justify-center z-15">
            <CenterTrick
              isSelectingMode={!modalOpen && room.phase === "selecting"}
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
              fiftyMoves={round?.mode === "FiftyOne" ? (round.fiftyMoves ?? []) : undefined}
              names={[0, 1, 2, 3].map((s) => name(s))}
              thinkingSeats={room.thinkingSeats ?? []}
              selectorSeat={room.selector}
              turnOrder={(() => {
                const dir = round?.direction ?? 1;
                const actor = room.actor ?? 0;
                return [0, 1, 2, 3].map((i) => (actor + i * dir + 16) % 4);
              })()}
            />
          </div>

          {/* LAST PLAY PANEL — bottom-right corner, only for trick modes */}
          {currentMode !== "FiftyOne" && (
            <LastPlayPanel
              trick={lastTrick ? {
                winner: lastTrick.winner,
                winnerName: name(lastTrick.winner),
                plays: lastTrick.plays.map((p) => ({
                  seat: p.seat,
                  card: p.card,
                  name: name(p.seat),
                })),
                trickIndex: room.round?.tricks.length ?? lastTrick.winner,
              } : null}
              mode={currentMode}
            />
          )}

          {/* OBJECTIVE BANNER — appears immediately on round_finished, during trick animation */}
          {currentMode !== "FiftyOne" && (
            <ObjectiveBanner
              banner={roundBanner}
              names={[0, 1, 2, 3].map((s) => name(s))}
              selectorSeat={room.selector}
            />
          )}

          {/* OBJECTIVE BANNER — appears immediately on round_finished, during trick animation */}
          {currentMode !== "FiftyOne" && (
            <ObjectiveBanner
              banner={roundBanner}
              names={[0, 1, 2, 3].map((s) => name(s))}
              selectorSeat={room.selector}
            />
          )}
        </div>
      </div>

      {/* BOTTOM: PLAYER HAND */}
      <div className="w-full flex flex-col items-center justify-end z-25 pb-6 shrink-0">
        {aceFor && myTurn && (
          <div className="flex items-center justify-center gap-3 p-2 bg-slate-950/95 border-2 border-amber-400 rounded-2xl mb-1 shadow-2xl z-30">
            <span className="text-xs font-black text-amber-300">Play Ace as:</span>
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

        {room.you !== null && room.phase !== "finished" && (
          <div className="flex items-center gap-2 mb-1">
            <span
              data-testid="turn-hint"
              className={`text-xs font-black px-3 py-0.5 rounded-full shadow-lg ${
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

        {room.you !== null && room.phase !== "finished" && (
          <div data-testid="hand" className="w-full flex justify-center overflow-visible">
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
          <p className="text-center text-xs text-slate-400 py-1">
            You are spectating this match.
          </p>
        )}
      </div>

      {/* ======================================================== */}
      {/* ROUND SUMMARY MODAL                                       */}
      {/* Driven by the raw round_finished socket event.           */}
      {/* Stays open regardless of what phase the server has moved  */}
      {/* on to — blocks all interaction until dismissed.          */}
      {/* ======================================================== */}
      {roundFinished && (
        <RoundSummaryModal
          roundNumber={roundFinished.roundNumber}
          mode={roundFinished.mode}
          endReason={roundFinished.endReason}
          selectorSeat={roundFinished.selector}
          players={room.seats.map((s, idx) => ({
            seat: idx,
            name: s?.name ?? `Seat ${idx + 1}`,
            avatar: s?.avatar ?? "🙂",
          }))}
          baseScores={roundFinished.base}
          multipliers={roundFinished.multipliers}
          finalScores={roundFinished.scores}
          onContinue={onRoundDismissed}
        />
      )}

      {/* FINAL RESULTS */}
      {room.phase === "finished" && !roundFinished && (
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
