"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { MODE_LABEL } from "@/lib/utils";
import type { GeneralBreakdown } from "@/hooks/useRoom";

interface RoundSummaryModalProps {
  roundNumber: number;
  mode: string;
  endReason: string | null;
  selectorSeat: number;
  players: { seat: number; name: string; avatar: string }[];
  baseScores: number[];
  multipliers: number[];
  finalScores: number[];
  generalBreakdown?: GeneralBreakdown[];
  switchSubMode?: string;
  switchSwaps?: [[number, number], [number, number]];
  onContinue: () => void;
}

export function RoundSummaryModal({
  roundNumber,
  mode,
  endReason,
  selectorSeat,
  players,
  baseScores,
  multipliers,
  finalScores,
  generalBreakdown,
  switchSubMode,
  switchSwaps,
  onContinue,
}: RoundSummaryModalProps) {
  // Pick an emoji for the end reason
  const reasonEmoji =
    endReason === "King of Hearts Captured" ? "👑"
    : endReason === "All Diamonds Captured" ? "♦"
    : endReason === "All Queens Captured" ? "👸"
    : endReason === "51 Reached" ? "🎯"
    : endReason === "Cards Depleted" ? "🃏"
    : endReason === "No Legal Moves Left" ? "🛑"
    : "✅";

  const isTurns = mode === "Turns";
  const isGeneral = mode === "General";
  const isSwitch = mode === "Switch";
  const generalCapotWinner = isGeneral
    ? (generalBreakdown ?? []).findIndex((b) => b.capot === -1000)
    : -1;
  const isCapot = endReason === "Capot";
  const isLastTrick = mode === "LastTrick";
  const isTrix = mode === "Trix";

  // In Capot the scores are -100/+100 (not trick×10), so derive trick counts separately:
  // the Capot winner is the seat with score === -100; they won 8 tricks, others 0.
  const capotWinnerSeat = isCapot
    ? (isGeneral ? generalCapotWinner : finalScores.findIndex((s) => s === -100))
    : -1;

  // Trix: 1st place has base -100, 2nd has base -50
  const trixFirst = isTrix ? baseScores.findIndex((b) => b === -100) : -1;
  const trixSecond = isTrix ? baseScores.findIndex((b) => b === -50) : -1;
  const trixPlace = (idx: number) => {
    if (idx === trixFirst) return "1st";
    if (idx === trixSecond) return "2nd";
    return "—";
  };

  const trickCountFor = (idx: number): number | null => {
    if (!isTurns) return null;
    if (isCapot) return idx === capotWinnerSeat ? 8 : 0;
    return (baseScores[idx] ?? 0) / 10;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        className="w-full max-w-lg rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 shadow-2xl"
      >
        <div className="text-center mb-5">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Round {roundNumber} Completed
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {MODE_LABEL[mode] || mode} Summary
          </h2>

          {/* End reason banner */}
          {isCapot ? (
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-400/60 text-amber-300 font-black text-sm shadow-[0_0_20px_rgba(251,191,36,0.4)]">
              <span>🏆</span>
              <span>CAPOT ACHIEVED</span>
              <span>🏆</span>
            </div>
          ) : isTrix ? (
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/80 border border-violet-400/60 text-violet-300 font-black text-sm">
              <span>🃏</span>
              <span>🏆 TRIX FINISHED</span>
            </div>
          ) : isLastTrick ? (
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold text-sm">
              <span>🏆</span>
              <span>Last Trick Won</span>
            </div>
          ) : isTurns ? (
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-950/60 border border-teal-500/40 text-teal-300 font-bold text-sm">
              <span>🔄</span>
              <span>Turns Completed</span>
            </div>
          ) : endReason ? (
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold text-sm">
              <span>{reasonEmoji}</span>
              <span>{endReason}</span>
            </div>
          ) : null}

          {/* Switch badge */}
          {isSwitch && (
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-black text-sm">
              <span>🔄</span>
              <span>SWITCH MODE</span>
              {switchSubMode && (
                <span className="text-amber-300">— {MODE_LABEL[switchSubMode] ?? switchSubMode}</span>
              )}
            </div>
          )}

          {/* Switch swap pairs */}
          {isSwitch && switchSwaps && (
            <div className="mt-2 text-xs text-slate-400 space-y-0.5">
              <div className="font-bold text-slate-300 mb-1">Hand Swaps:</div>
              {switchSwaps.map(([a, b], i) => (
                <div key={i} className="font-mono text-slate-300">
                  {players[a]?.name ?? `Seat ${a + 1}`}
                  <span className="text-cyan-400 mx-1">↔</span>
                  {players[b]?.name ?? `Seat ${b + 1}`}
                </div>
              ))}
            </div>
          )}

          {isCapot ? (
            <p className="text-xs text-amber-400/80 mt-2 font-semibold">
              Capot overrides all scoring — no multiplier applies.
            </p>
          ) : isSwitch ? (
            <p className="text-xs text-cyan-400/80 mt-2 font-semibold">
              Switch doubles all scores (×2 bonus). Selector ({players[selectorSeat]?.name}) gets <b>×4 total</b>!
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-2">
              Selector ({players[selectorSeat]?.name}) receives <b>x2 Double Points</b>!
            </p>
          )}
        </div>

        {isGeneral && generalBreakdown && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {players.map((p, idx) => {
              const b = generalBreakdown[idx] ?? { kingHearts: 0, diamonds: 0, queens: 0, turns: 0, lastTrick: 0, capot: 0 };
              const items = [
                ["King Hearts", b.kingHearts],
                ["Diamonds", b.diamonds],
                ["Queens", b.queens],
                ["Turns", b.turns],
                ["Last Trick", b.lastTrick],
                ["Capot", b.capot],
              ].filter(([, value]) => value !== 0);
              return (
                <div key={p.seat} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="font-bold text-white mb-1">{p.avatar} {p.name}</div>
                  <div className="space-y-0.5 text-xs">
                    {items.map(([label, value]) => (
                      <div key={label} className="flex justify-between text-slate-300">
                        <span>{label}</span><span className={Number(value) < 0 ? "text-rose-300" : "text-emerald-300"}>{Number(value) > 0 ? "+" : ""}{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-800 mt-1 pt-1 font-bold text-white">
                      <span>Multiplier x{multipliers[idx] ?? 1}</span>
                      <span>{finalScores[idx] > 0 ? "+" : ""}{finalScores[idx] ?? 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Breakdown Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 mb-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold uppercase text-slate-400">
                <th className="py-2.5 px-3">Player</th>
                {isTurns && <th className="py-2.5 px-3 text-center">Tricks</th>}
                {isTrix && <th className="py-2.5 px-3 text-center">Place</th>}
                {!isCapot && <th className="py-2.5 px-3 text-center">Base Score</th>}
                {!isCapot && !isTrix && <th className="py-2.5 px-3 text-center">Multiplier</th>}
                <th className="py-2.5 px-3 text-right">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {players.map((p, idx) => {
                const isSelector = idx === selectorSeat;
                const base = baseScores[idx] ?? 0;
                const mult = multipliers[idx] ?? 1;
                const final = finalScores[idx] ?? 0;
                const tricks = trickCountFor(idx);
                const isCapotWinner = isCapot && idx === capotWinnerSeat;
                const isTrixPodium = isTrix && (idx === trixFirst || idx === trixSecond);

                return (
                  <tr
                    key={p.seat}
                    className={`transition-colors ${
                      isCapotWinner
                        ? "bg-amber-950/40"
                        : isTrixPodium
                        ? "bg-violet-950/30"
                        : isSelector && !isCapot && !isTrix
                        ? "bg-purple-950/30"
                        : "hover:bg-slate-900/40"
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.avatar}</span>
                        <span className="font-semibold text-white truncate max-w-[110px]">
                          {p.name}
                        </span>
                        {isCapotWinner && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-400/40">
                            🏆 Capot
                          </span>
                        )}
                        {!isCapot && !isTrix && isSelector && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-400/40">
                            Selector
                          </span>
                        )}
                        {isTrix && isSelector && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-400/40">
                            Selector
                          </span>
                        )}
                      </div>
                    </td>
                    {isTurns && (
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={isCapotWinner ? "text-amber-300" : "text-teal-300"}>
                          {tricks}
                        </span>
                      </td>
                    )}
                    {isTrix && (
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={idx === trixFirst ? "text-amber-300" : idx === trixSecond ? "text-slate-300" : "text-slate-600"}>
                          {trixPlace(idx)}
                        </span>
                      </td>
                    )}
                    {!isCapot && (
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {base}
                      </td>
                    )}
                    {!isCapot && !isTrix && (
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span
                          className={
                            mult > 1
                              ? "text-purple-400 px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/40"
                              : "text-slate-400"
                          }
                        >
                          x{mult}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-3 text-right font-mono font-bold text-base">
                      <span className={isCapotWinner ? "text-rose-400" : final < 0 ? "text-rose-400" : final > 0 ? "text-emerald-400" : "text-slate-500"}>
                        {final > 0 ? "+" : ""}{final}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-5">
          <span>Remember: <b>Lowest score wins the match!</b></span>
        </div>

        <Button onClick={onContinue} className="w-full py-3 text-base shadow-xl font-bold">
          Continue to Next Round
        </Button>
      </motion.div>
    </div>
  );
}
