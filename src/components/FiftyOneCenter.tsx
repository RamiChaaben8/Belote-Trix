"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import type { CardData } from "@/types";
import { SUIT_SYMBOL } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface FiftyOneMove {
  seat: number;
  card: CardData;
  delta: number;
  prevTotal: number;
  newTotal: number;
  aceValue: 1 | 11 | null;
}

interface Props {
  total: number;
  direction: 1 | -1;
  recentPlays: { seat: number; card: CardData; delta: number; aceValue?: 1 | 11 | null }[];
  moveLog: FiftyOneMove[];
  names: string[];
  avatars?: string[];
  youSeat: number;
  thinkingSeats: number[];
  selectorSeat: number | null;
  turnOrder: number[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function deltaLabel(card: CardData, delta: number, aceValue?: 1 | 11 | null): string {
  if (card.rank === "J") return "↺ Rev";
  if (card.rank === "9") return "Pass";
  if (aceValue) return `+${aceValue}`;
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function deltaColor(card: CardData, delta: number): string {
  if (card.rank === "J") return "text-purple-300";
  if (card.rank === "9") return "text-slate-400";
  if (delta > 0) return "text-emerald-300";
  if (delta < 0) return "text-rose-400";
  return "text-slate-400";
}

// ─────────────────────────────────────────────
// Animated counter
// ─────────────────────────────────────────────
function AnimatedScore({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    prevRef.current = target;
    if (start === target) return;
    const duration = 500;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(start + (target - start) * ease));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return <>{displayed}</>;
}

// ─────────────────────────────────────────────
// Thinking dots
// ─────────────────────────────────────────────
function ThinkingDots() {
  return (
    <span className="flex gap-0.5 items-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-purple-400 inline-block"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22 }}
        />
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
import { useSettings } from "@/hooks/useSettings";
import { playSound } from "@/lib/sound";

export function FiftyOneCenter({
  total,
  direction,
  moveLog,
  names,
  avatars,
  thinkingSeats,
  selectorSeat,
  turnOrder,
}: Props) {
  const { sound } = useSettings();
  const [jackEffect, setJackEffect] = useState(false);
  const [aceAnnouncement, setAceAnnouncement] = useState<{ name: string; value: 1 | 11 } | null>(null);
  const [showLoser, setShowLoser] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [loserSeat, setLoserSeat] = useState<number | null>(null);
  const [winnerSeat, setWinnerSeat] = useState<number | null>(null);
  const prevLogLenRef = useRef(moveLog.length);

  // Detect new moves → trigger effects
  useEffect(() => {
    if (moveLog.length > prevLogLenRef.current) {
      const newest = moveLog[moveLog.length - 1];
      if (newest.card.rank === "J") {
        setJackEffect(true);
        setTimeout(() => setJackEffect(false), 2500);
      }
      if (newest.card.rank === "A" && newest.aceValue != null) {
        setAceAnnouncement({
          name: names[newest.seat] ?? `Seat ${newest.seat + 1}`,
          value: newest.aceValue,
        });
        setTimeout(() => setAceAnnouncement(null), 2200);
      }
      prevLogLenRef.current = moveLog.length;
    }
  }, [moveLog, names]);

  // When total reaches or exceeds 51:
  // Exact 51:
  //   1. Freeze input
  //   2. Highlight winner
  //   3. Show center popup: 🏆 EXACTLY 51, Winner: PlayerName, Base: 510, Multiplier: x2 if selector, Final: 1020 / 510
  //   4. Wait 3 seconds, update scoreboard / start next round
  // Exceeds 51 (> 51):
  //   Show BUSTED popup, PlayerName, Total, Exceeded 51, wait 3s
  useEffect(() => {
    if (moveLog.length > 0) {
      const last = moveLog[moveLog.length - 1];
      const cardVal = last.card.rank === "A" && last.aceValue != null
        ? last.aceValue
        : last.delta;
      console.log("Total before play:", last.prevTotal);
      console.log("Card value:", cardVal);
      console.log("New total:", total);
      console.log("CHECK WIN:", total === 51);
      console.log("CHECK LOSS:", total > 51);
    }

    if (total === 51) {
      const last = moveLog[moveLog.length - 1];
      if (last) {
        console.log("RESULT SCREEN OPENED");
        setWinnerSeat(last.seat);
        setShowWinner(true);
        setShowLoser(false);
        playSound("win", sound);
      }
    } else if (total > 51) {
      const last = moveLog[moveLog.length - 1];
      if (last) {
        console.log("RESULT SCREEN OPENED");
        setLoserSeat(last.seat);
        setShowLoser(true);
        setShowWinner(false);
        playSound("bust", sound);
      }
    } else {
      setShowLoser(false);
      setShowWinner(false);
      setLoserSeat(null);
      setWinnerSeat(null);
    }
  }, [total, moveLog, sound]);

  // Discard pile: last 10 moves, oldest→newest (newest rendered last = on top)
  const pileCards = moveLog.slice(-10);

  // Thinking name
  const thinkingName = thinkingSeats.length > 0
    ? (names[thinkingSeats[0]] ?? `Seat ${thinkingSeats[0] + 1}`)
    : null;

  // Last played card for "Current Card" header
  const lastMove = moveLog.length > 0 ? moveLog[moveLog.length - 1] : null;

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">

      {/* ════════════════════════════════════════════════════════ */}
      {/* MAIN ROW: [Discard Pile]  +  [Score & Log panel]        */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-5 sm:gap-7">

        {/* ── LEFT COLUMN: Discard pile ── */}
        <div className="flex flex-col items-center gap-1.5">
          {/* "Current Card" label */}
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {lastMove ? (names[lastMove.seat] ?? `Seat ${lastMove.seat + 1}`) + " played" : "Discard Pile"}
          </span>

          {/* THE PILE — absolutely stacked cards */}
          <div
            className="relative"
            style={{ width: 72, height: 104 }}   /* md card = w-16 h-24 = 64×96, +8px breathing */
          >
            <AnimatePresence>
              {pileCards.map((m, i) => {
                const isTop = i === pileCards.length - 1;
                // Each card is slightly rotated + offset for a real pile feel
                // Deterministic pseudo-random rotation based on seq
                const seed = (m.seat * 7 + (m.newTotal ?? 0) * 3) % 17;
                const rot = ((seed - 8) * 1.2);   // -9.6° to +9.6°
                const dx  = ((seed % 5) - 2) * 2; // -4 to +4 px drift
                const dy  = ((seed % 3) - 1) * 2; // -2 to +2 px drift

                return (
                  <motion.div
                    key={`pile-${m.seat}-${m.card.rank}${m.card.suit}-${m.newTotal}`}
                    initial={isTop ? { y: -30, scale: 0.85, opacity: 0, rotate: 0 } : false}
                    animate={{
                      y: dy,
                      x: dx,
                      rotate: rot,
                      scale: isTop ? 1.05 : 1,
                      opacity: 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      zIndex: i + 1,
                    }}
                    className={isTop ? "drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]" : ""}
                  >
                    <PlayingCard
                      card={m.card}
                      size="md"
                      isWinning={isTop && total === 51}
                      className={
                        isTop
                          ? total === 51
                            ? "ring-4 ring-rose-500 border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.9)] animate-pulse"
                            : "ring-2 ring-amber-400/60 border-amber-300/40"
                          : "opacity-90"
                      }
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty pile placeholder */}
            {pileCards.length === 0 && (
              <div className="absolute inset-0 rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-900/20 flex items-center justify-center">
                <span className="text-slate-600 text-2xl">?</span>
              </div>
            )}
          </div>

          {/* Delta badge for top card */}
          <AnimatePresence mode="wait">
            {lastMove && (
              <motion.div
                key={`delta-${lastMove.card.rank}${lastMove.card.suit}-${lastMove.newTotal}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <span className={`text-base sm:text-lg font-black ${deltaColor(lastMove.card, lastMove.delta)}`}>
                  {deltaLabel(lastMove.card, lastMove.delta, lastMove.aceValue)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT COLUMN: Score + compact log ── */}
        <div className="flex flex-col items-center gap-2.5">

          {/* Score hub */}
          <div
            className={`flex flex-col items-center justify-center rounded-2xl border-2 px-4 py-2.5 shadow-2xl transition-all duration-300
              ${total === 51
                ? "border-rose-500 bg-rose-950/90 shadow-[0_0_50px_rgba(244,63,94,0.95)]"
                : total >= 45
                ? "border-rose-400/80 bg-rose-950/60 shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                : "border-slate-700/60 bg-slate-900/80"
              }`}
          >
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
              Total
            </span>
            <span
              data-testid="fifty-total"
              className={`font-black tabular-nums leading-none
                ${total === 51
                  ? "text-5xl text-rose-300 drop-shadow-[0_0_18px_rgba(244,63,94,1)] animate-bounce"
                  : total >= 45
                  ? "text-5xl text-rose-300"
                  : "text-5xl text-amber-200"
                }`}
            >
              <AnimatedScore target={total} />
            </span>
            <span className="text-sm font-bold text-slate-500 leading-none mt-0.5">/ 51</span>
            <span className={`text-[10px] font-semibold mt-1 ${direction === 1 ? "text-emerald-400" : "text-rose-400"}`}>
              {direction === 1 ? "↻ Clockwise" : "↺ Reverse"}
            </span>
          </div>

          {/* Compact move log — last 4 lines only */}
          {moveLog.length > 0 && (
            <div className="flex flex-col gap-0.5 w-[130px] sm:w-[150px]">
              {[...moveLog].reverse().slice(0, 4).map((m, i) => {
                const isJ = m.card.rank === "J";
                const isA = m.card.rank === "A";
                const suitColor = m.card.suit === "H" || m.card.suit === "D"
                  ? "text-rose-400" : "text-slate-300";
                return (
                  <motion.div
                    key={`log-${i}-${m.seat}-${m.card.rank}${m.card.suit}`}
                    initial={i === 0 ? { opacity: 0, x: 6 } : {}}
                    animate={{ opacity: Math.max(0.3, 1 - i * 0.2), x: 0 }}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <span className="font-bold text-slate-300 truncate max-w-[46px]">
                      {names[m.seat] ?? `P${m.seat + 1}`}
                    </span>
                    <span className={`font-black ${suitColor}`}>
                      {m.card.rank}{SUIT_SYMBOL[m.card.suit]}
                    </span>
                    <span className={`font-bold ${deltaColor(m.card, m.delta)}`}>
                      {isJ ? "↺" : isA && m.aceValue ? `+${m.aceValue}` : (m.delta > 0 ? `+${m.delta}` : `${m.delta}`)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Thinking indicator */}
          <AnimatePresence>
            {thinkingName && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/90 border border-purple-400/50"
              >
                <ThinkingDots />
                <span className="text-[10px] text-purple-300 font-semibold">
                  {thinkingName}…
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* JACK OVERLAY                                            */}
      {/* ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {jackEffect && (
          <motion.div
            key="jack"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="px-5 py-3 rounded-2xl bg-slate-950/97 border-2 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.8)] flex flex-col items-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-purple-300">
                ↺ DIRECTION REVERSED
              </span>
              <span className={`text-xs font-bold ${direction === -1 ? "text-rose-300" : "text-emerald-300"}`}>
                Now: {direction === -1 ? "↺ Counter-clockwise" : "↻ Clockwise"}
              </span>
              {turnOrder.length === 4 && (
                <div className="flex items-center gap-1 flex-wrap justify-center mt-0.5">
                  {turnOrder.map((seat, i) => (
                    <span key={seat} className="flex items-center gap-0.5">
                      <span className="text-[11px] font-bold text-white bg-slate-800 rounded px-1.5 py-0.5">
                        {names[seat] ?? `Seat ${seat + 1}`}
                      </span>
                      {i < turnOrder.length - 1 && <span className="text-slate-500 text-[10px]">→</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ACE ANNOUNCEMENT                                        */}
      {/* ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {aceAnnouncement && !jackEffect && (
          <motion.div
            key="ace"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute top-1 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="px-4 py-1.5 rounded-full bg-yellow-950/95 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] text-yellow-300 font-black text-sm flex items-center gap-2 whitespace-nowrap">
              <span>🃏</span>
              <span>{aceAnnouncement.name} chose +{aceAnnouncement.value}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════ */}
      {/* FIFTY ONE - LOSER ANIMATION (BUSTED / EXCEEDED 51)       */}
      {/* ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showLoser && loserSeat !== null && (
          <motion.div
            key="loser"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            {/* Screen shake & Red pulse backdrop */}
            <div className="absolute -inset-10 rounded-full animate-red-pulse pointer-events-none" />

            <div className="relative flex flex-col items-center gap-2.5 px-8 py-6 rounded-3xl bg-slate-950/98 border-4 border-rose-500 shadow-[0_0_80px_rgba(244,63,94,0.95)] animate-screen-shake text-center max-w-sm sm:max-w-md">
              {/* Skull / Bomb header */}
              <div className="flex items-center gap-2 text-3xl sm:text-4xl animate-bounce">
                <span>💥</span>
                <span className="font-black text-rose-500 tracking-wider">BUSTED</span>
                <span>💥</span>
              </div>

              {/* Loser Avatar with glowing ring */}
              <div className="relative my-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-4xl sm:text-5xl border-4 border-rose-500 bg-rose-950 shadow-[0_0_30px_rgba(244,63,94,0.8)]">
                  {avatars?.[loserSeat] ?? "💀"}
                </div>
                <span className="absolute -bottom-1 -right-1 text-2xl">💀</span>
              </div>

              {/* Loser Name */}
              <span className="text-xl sm:text-2xl font-black text-rose-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)] uppercase tracking-wide">
                Player: {names[loserSeat] ?? `Seat ${loserSeat + 1}`}
              </span>

              <div className="flex items-center gap-2 text-sm font-bold text-rose-200">
                <span>Total: {total}</span>
                <span>•</span>
                <span className="text-rose-400 font-black">Exceeded 51</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════ */}
      {/* FIFTY ONE - WINNER DISPLAY (EXACTLY 51)                  */}
      {/* ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showWinner && winnerSeat !== null && (
          <motion.div
            key="winner"
            initial={{ opacity: 0, scale: 0.75, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="relative flex flex-col items-center gap-2.5 px-8 py-5 rounded-3xl bg-slate-950/98 border-2 border-amber-400 shadow-[0_0_70px_rgba(251,191,36,0.9)] text-center min-w-[280px]">
              <div className="flex items-center gap-1.5 text-amber-300 font-black text-base sm:text-lg uppercase tracking-widest">
                <span className="text-xl">🏆</span>
                <span>EXACTLY 51</span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{avatars?.[winnerSeat] ?? "🙂"}</span>
                <span className="text-base sm:text-lg font-black text-white">
                  Winner: <span className="text-amber-300">{names[winnerSeat] ?? `Seat ${winnerSeat + 1}`}</span>
                </span>
              </div>

              {/* Score / Multiplier breakdown */}
              <div className="flex items-center justify-center gap-4 py-1.5 px-3 rounded-xl bg-slate-900/90 border border-amber-400/30 text-xs font-mono">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 uppercase">Base Score</span>
                  <span className="text-emerald-400 font-bold">510</span>
                </div>
                {selectorSeat === winnerSeat ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-purple-400 uppercase">Multiplier</span>
                    <span className="text-purple-300 font-bold">x2</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase">Multiplier</span>
                    <span className="text-slate-300 font-bold">x1</span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-amber-400 uppercase">Final Score</span>
                  <span className="text-amber-300 font-black text-sm">
                    {selectorSeat === winnerSeat ? "1020" : "510"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
