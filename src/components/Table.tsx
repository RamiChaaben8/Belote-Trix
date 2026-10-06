"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardFan } from "@/components/CardFan";
import { OpponentHand } from "@/components/OpponentHand";
import { PlayerPod } from "@/components/PlayerPod";
import { CenterTrick } from "@/components/CenterTrick";
import { TrixCenter } from "@/components/TrixCenter";
import { ScoreboardPanel } from "@/components/ScoreboardPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { RoundSummaryModal } from "@/components/RoundSummaryModal";
import { FinalResultsModal } from "@/components/FinalResultsModal";
import { LastPlayPanel } from "@/components/LastPlayPanel";
import { ObjectiveBanner } from "@/components/ObjectiveBanner";
import { SwitchRevealOverlay } from "@/components/SwitchRevealOverlay";
import { SwitchSwapAnimation } from "@/components/SwitchSwapAnimation";
import type { LastTrickItem } from "@/components/LastPlayPanel";
import type { LastTrick, RoomView, ChatEntry, RoundFinishedPayload } from "@/hooks/useRoom";
import type { CardData, Move, ModeId } from "@/types";

type Act = (event: string, payload?: unknown) => Promise<unknown>;

const POS = ["bottom", "left", "top", "right"] as const;
type Position = (typeof POS)[number];

/**
 * LAYOUT (see globals.css → .table-grid / .z-*):
 *
 *   "tl  top  tr"
 *   "left center right"
 *   "bl bottom br"     rows/cols: auto minmax(0,1fr) auto
 *
 * - Each player owns a dedicated zone (pod + their own card-count
 *   pill + their hand). Zones are separate grid cells, so the Trix
 *   board / trick area can never overlap an avatar, label or hand.
 * - The Trix board and trick cards live ONLY in the `center` zone
 *   (position:relative; overflow:hidden; container-type:size).
 * - The felt oval is a decorative background (.table-felt,
 *   pointer-events:none); the grid sits on top with padding.
 * - Scoreboard / chat / leave button / banners are overlays and do
 *   not shrink the table.
 */
export function Table({
  room,
  lastTrick,
  roundFinished,
  roundBanner,
  onRoundDismissed,
  chat,
  act,
  gameId,
  trixExtraTurnSeat,
  onTrixPass,
  switchCountdown,
  switchSwapAnimating = false,
}: {
  room: RoomView;
  lastTrick: LastTrick | null;
  /** Live payload from the `round_finished` socket event — non-null while modal should show. */
  roundFinished: RoundFinishedPayload | null;
  /** Immediate banner shown during trick collection animation, before the full modal. */
  roundBanner: RoundFinishedPayload | null;
  /** Called when the user clicks "Continue" on the round summary modal. */
  onRoundDismissed: () => void;
  /** Seat that just got an Ace extra turn in Trix mode. */
  trixExtraTurnSeat?: number | null;
  /** Called when the user clicks PASS in Trix mode. */
  onTrixPass?: () => void;
  chat?: ChatEntry[];
  act: Act;
  gameId: string | null;
  switchCountdown?: number | null;
  switchSwapAnimating?: boolean;
}) {
  const me = room.you ?? 0;
  const rel = (seat: number) => (seat - me + 4) % 4;

  const [aceFor, setAceFor] = useState<CardData | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [currentLastTrick, setCurrentLastTrick] = useState<LastTrickItem | null>(null);

  const round = room.round;
  const name = (s: number) => room.seats[s]?.name ?? `Seat ${s + 1}`;

  // Block card plays while the round-summary modal OR the objective banner is showing.
  const modalOpen = (room.gameType !== "quick" && roundFinished !== null) || roundBanner !== null;
  const myTurn = !modalOpen && room.you !== null && room.actor === room.you;
  const isSelector = !modalOpen && (room.phase === "selecting" || room.phase === "switch_sub" || room.phase === "switch_target") && room.selector === room.you;

  // PASS button is enabled only when the player has no legal move,
  // OR when every legal move is an Ace (the Ace exception).
  const canPass =
    myTurn &&
    round?.mode === "Trix" &&
    onTrixPass !== undefined &&
    (room.legal.length === 0 || room.legal.every((m) => m.card.rank === "A"));

  const currentMode =
    round?.mode ??
    (room.history.length ? room.history[room.history.length - 1].mode : "");

  // Reset last trick when mode changes or new round starts with a different mode
  useEffect(() => {
    setCurrentLastTrick(null);
  }, [currentMode]);

  // Update to the latest completed trick when a new trick finishes
  useEffect(() => {
    if (!lastTrick) return;
    setCurrentLastTrick({
      winner: lastTrick.winner,
      winnerName: name(lastTrick.winner),
      plays: lastTrick.plays.map((p) => ({
        seat: p.seat,
        card: p.card,
        name: name(p.seat),
      })),
    });
  }, [lastTrick]);

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

  const [lastPlayedCard, setLastPlayedCard] = useState<CardData | null>(null);

  const handleCardClick = (c: CardData) => {
    if (modalOpen) return; // hard block while result modal is open
    const moves = legalFor(c);
    if (!moves.length || !myTurn) return;
    setSelectedCard(c);
    if (moves.length > 1) {
      setAceFor(c);
    } else {
      setAceFor(null);
      if (round?.mode === "Trix") {
        setLastPlayedCard(c);
      }
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

  // Seat occupying a given grid position ("bottom" | "left" | "top" | "right").
  const seatAt = (position: Position) => {
    const idx = [0, 1, 2, 3].find((i) => POS[rel(i)] === position);
    if (idx === undefined) return null;
    const data = room.seats[idx];
    if (!data) return null;
    return { idx, data };
  };

  const zoneTest = (position: Position) => {
    const info = seatAt(position);
    return info ? `seat-${info.idx}` : undefined;
  };

  const renderSeat = (position: Position) => {
    const info = seatAt(position);
    if (!info) return null;
    const { idx, data } = info;
    const isTurn = !modalOpen && room.actor === idx && room.phase !== "finished";
    const isDealer = room.dealer === idx;
    const isRoundSelector = room.selector === idx;
    const count = room.handCounts[idx] ?? 0;
    const isThinking = (room.thinkingSeats ?? []).includes(idx);

    return (
      <>
        <PlayerPod
          seat={idx}
          name={data.name}
          avatar={data.avatar}
          totalScore={room.totals[idx]}
          isBot={data.isBot}
          connected={data.connected}
          isCurrentTurn={isTurn}
          isThinking={isThinking}
          isDealer={isDealer}
          isSelector={isRoundSelector}
          cardCount={count}
          position={position}
        />
        {position !== "bottom" && room.phase !== "finished" && (
          <OpponentHand
            cardCount={count}
            position={position}
            isThinking={isThinking}
            isCurrentTurn={isTurn}
          />
        )}
      </>
    );
  };

  return (
    <div className="relative h-full w-full min-h-0 select-none overflow-hidden">
      {/* Decorative felt — background only, never receives pointer events */}
      <div className="table-felt" aria-hidden />

      {/* FIXED SCOREBOARD (collapsible overlay) */}
      <ScoreboardPanel
        roundNumber={Math.min(
          room.roundNumber + (room.phase === "selecting" ? 1 : 0),
          room.totalRounds
        )}
        totalRounds={room.totalRounds}
        mode={currentMode}
        selectorName={room.selector !== null ? name(room.selector) : "—"}
        isQuickTest={room.gameType === "quick"}
        liveScores={round?.scores}
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

      {/* GRID — player zones + isolated center */}
      <div className="table-grid relative z-10">
        {/* TL corner — reserved for the scoreboard overlay */}
        <div className="zone z-tl" />

        {/* TOP player */}
        <div className="zone z-top" data-testid={zoneTest("top")}>
          {renderSeat("top")}
        </div>

        {/* TR corner — dev badge + broken-suits indicator (clears chat toggle) */}
        <div className="zone z-tr">
          {room.gameType === "quick" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                TEST MODE
              </span>
            </div>
          )}
          {round && (round.mode === "KingOfHearts" || round.mode === "Diamonds") && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
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
          {/* Switch mode indicator */}
          {room.phase === "playing" && room.history.some((h) => h.number === room.roundNumber && h.mode === "Switch") && (
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                <span className="text-cyan-300 font-black text-[11px]">🔄 SWITCH MODE</span>
              </div>
              <span className="text-[9px] text-cyan-400/70 font-mono px-1">×2 all · selector ×4</span>
            </div>
          )}
        </div>

        {/* LEFT player */}
        <div className="zone z-left" data-testid={zoneTest("left")}>
          {renderSeat("left")}
        </div>

        {/* CENTER — the ONLY home of the mode selector, trick area and
            Trix lanes. position:relative + overflow:hidden + container
            queries: nothing inside can ever leave this box. */}
        <div className="zone z-center">
          <div className="absolute inset-0 z-[1] flex items-center justify-center">
            <CenterTrick
              isSelectingMode={!modalOpen && room.phase === "selecting"}
              isCurrentUserSelector={isSelector}
              selectorName={room.selector !== null ? name(room.selector) : ""}
              remainingModes={(room.remaining as ModeId[]) ?? []}
              onSelectMode={(m) => void act("select_mode", { mode: m })}
              switchPhase={room.switchState?.phase}
              completedModes={(room.completedModes ?? []) as ModeId[]}
              onSelectSwitchSubMode={(m) => void act("switch_sub_mode", { subMode: m })}
              switchSubMode={room.switchState?.subMode}
              onSelectSwitchTarget={(target) => void act("switch_target", { target })}
              seatNames={[0, 1, 2, 3].map((s) => name(s))}
              seatAvatars={[0, 1, 2, 3].map((s) => room.seats[s]?.avatar ?? "🙂")}
              youSeatForSwitch={me}
              plays={currentMode === "Trix" ? [] : centerPlays}
              youSeat={me}
              winnerSeat={winningSeat}
              winnerName={winningPlayerName}
              mode={currentMode}
              fiftyTotal={round?.mode === "FiftyOne" ? round.total : undefined}
              fiftyDirection={round?.direction}
              isCollecting={isCollecting}
              fiftyMoves={round?.mode === "FiftyOne" ? (round.fiftyMoves ?? []) : undefined}
              names={[0, 1, 2, 3].map((s) => name(s))}
              avatars={[0, 1, 2, 3].map((s) => room.seats[s]?.avatar ?? "🙂")}
              thinkingSeats={room.thinkingSeats ?? []}
              selectorSeat={room.selector}
              turnOrder={(() => {
                const dir = round?.direction ?? 1;
                const actor = room.actor ?? 0;
                return [0, 1, 2, 3].map((i) => (actor + i * dir + 16) % 4);
              })()}
              trickCounts={
                round?.mode === "Turns"
                  ? ([0, 1, 2, 3].map((s) => round.tricks.filter((t) => t.winner === s).length))
                  : undefined
              }
            />
          </div>

          {/* TRIX CENTER — 4 suit lanes, shown when mode is Trix */}
          {currentMode === "Trix" && round?.trixTable && (
            <TrixCenter
              table={round.trixTable}
              extraTurnSeat={trixExtraTurnSeat ?? null}
              names={[0, 1, 2, 3].map((s) => name(s))}
              finishOrder={round.trixFinishOrder ?? []}
              yourSeat={me}
              lastPlayedCard={lastPlayedCard}
              legalMoves={room.legal}
            />
          )}

          {/* LAST PLAY PANEL — center's bottom-right corner (trick modes only) */}
          {currentMode !== "FiftyOne" && currentMode !== "Trix" && (
            <LastPlayPanel lastTrick={currentLastTrick} mode={currentMode} />
          )}
        </div>

        {/* RIGHT player */}
        <div className="zone z-right" data-testid={zoneTest("right")}>
          {renderSeat("right")}
        </div>

        {/* BL / BR corners — free space */}
        <div className="zone z-bl" />
        <div className="zone z-br" />

        {/* BOTTOM — my pod + turn hint + PASS + my hand */}
        <div className="zone z-bottom" data-testid={zoneTest("bottom")}>
          <div className="flex w-full flex-col items-center gap-1">
            {aceFor && myTurn && (
              <div className="flex items-center justify-center gap-3 p-2 bg-slate-950/95 border-2 border-amber-400 rounded-2xl shadow-2xl z-30">
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

            <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
              {renderSeat("bottom")}
              {room.you !== null && room.phase !== "finished" && (
                <span
                  data-testid="turn-hint"
                  className={`text-xs font-black px-3 py-0.5 rounded-full shadow-lg text-center ${
                    myTurn && room.round?.mode === "Trix"
                      ? "bg-amber-400 text-slate-950 animate-pulse border border-yellow-200"
                      : myTurn
                      ? "bg-amber-400 text-slate-950 border border-yellow-200"
                      : "bg-slate-900/90 text-slate-300 border border-slate-700"
                  }`}
                >
                  {myTurn
                    ? room.phase === "selecting"
                      ? "Select a mode in the center of the table!"
                      : room.round?.mode === "Trix"
                      ? "Your turn! Click a highlighted card to play (or PASS)"
                      : "Your turn! Click a highlighted card to play"
                    : room.actor !== null
                    ? (room.thinkingSeats ?? []).includes(room.actor)
                      ? `${name(room.actor)} is thinking…`
                      : `Waiting for ${name(room.actor)}…`
                    : ""}
                </span>
              )}

              {/* PASS button for Trix mode */}
              {round?.mode === "Trix" && canPass && onTrixPass && (
                <button
                  data-testid="trix-pass-button"
                  onClick={onTrixPass}
                  className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-600 hover:border-slate-500 shadow-md transition-all active:scale-95"
                >
                  PASS
                </button>
              )}
            </div>

            {room.you !== null && room.phase !== "finished" && (
              <div data-testid="hand" className="-mt-2 w-full flex justify-center overflow-visible">
                <CardFan
                  cards={room.hand}
                  legalMoves={room.legal}
                  isMyTurn={myTurn}
                  selectedCard={selectedCard}
                  onCardClick={handleCardClick}
                  disabled={!myTurn}
                  isSelectingMode={room.phase === "selecting"}
                />
              </div>
            )}

            {room.you === null && (
              <p className="text-center text-xs text-slate-400 py-1">
                You are spectating this match.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* OBJECTIVE BANNER — full-screen dim during trick collection */}
      {currentMode !== "FiftyOne" && (
        <ObjectiveBanner
          banner={roundBanner}
          names={[0, 1, 2, 3].map((s) => name(s))}
          selectorSeat={room.selector}
        />
      )}

      {/* ======================================================== */}
      {/* SWITCH REVEAL OVERLAY                                     */}
      {/* Shown during the 10-second countdown before hand swap.   */}
      {/* ======================================================== */}
      {room.phase === "switch_reveal" &&
        room.switchState &&
        room.switchState.swapTarget !== null &&
        room.switchState.otherPair !== null &&
        room.you !== null &&
        room.switchState.currentHand && (
          <SwitchRevealOverlay
            countdown={switchCountdown ?? room.switchState.revealCountdown}
            selectorSeat={room.selector ?? 0}
            swapTarget={room.switchState.swapTarget}
            otherPair={room.switchState.otherPair}
            currentHand={room.switchState.currentHand as CardData[]}
            seatNames={[0, 1, 2, 3].map((s) => name(s))}
            seatAvatars={[0, 1, 2, 3].map((s) => room.seats[s]?.avatar ?? "🙂")}
            youSeat={me}
          />
        )}

      {/* ======================================================== */}
      {/* SWITCH SWAP ANIMATION                                     */}
      {/* 2.5-second animation after countdown ends.               */}
      {/* ======================================================== */}
      {switchSwapAnimating &&
        room.lastRoundResult &&
        room.lastRoundResult.mode === "Switch" &&
        room.lastRoundResult.switchSwaps && (
          <SwitchSwapAnimation
            selectorSeat={room.selector ?? 0}
            swapTarget={room.lastRoundResult.switchSwaps[0][1]}
            otherPair={room.lastRoundResult.switchSwaps[1]}
            seatNames={[0, 1, 2, 3].map((s) => name(s))}
            seatAvatars={[0, 1, 2, 3].map((s) => room.seats[s]?.avatar ?? "🙂")}
            subMode={room.lastRoundResult.switchSubMode ?? ""}
          />
        )}

      {/* ======================================================== */}
      {/* ROUND SUMMARY MODAL                                       */}
      {/* Driven by the raw round_finished socket event.           */}
      {/* Stays open regardless of what phase the server has moved  */}
      {/* on to — blocks all interaction until dismissed.          */}
      {/* ======================================================== */}
      {roundFinished && room.gameType !== "quick" && (
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
          generalBreakdown={roundFinished.generalBreakdown}
          switchSubMode={roundFinished.switchSubMode}
          switchSwaps={roundFinished.switchSwaps}
          onContinue={onRoundDismissed}
        />
      )}

      {/* FINAL RESULTS */}
      {room.phase === "finished" && (!roundFinished || room.gameType === "quick") && (
        <FinalResultsModal
          players={room.seats.map((s, idx) => ({
            seat: idx,
            name: s?.name ?? `Seat ${idx + 1}`,
            avatar: s?.avatar ?? "🙂",
          }))}
          totals={room.totals}
          stats={room.stats}
          replayId={gameId}
          isQuickTest={room.gameType === "quick"}
          onPlayAgain={() => (window.location.href = "/")}
        />
      )}
    </div>
  );
}
