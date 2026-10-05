"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { MODE_LABEL } from "@/lib/utils";

interface RoundSummaryModalProps {
  roundNumber: number;
  mode: string;
  selectorSeat: number;
  players: { seat: number; name: string; avatar: string }[];
  baseScores: number[];
  multipliers: number[];
  finalScores: number[];
  onContinue: () => void;
}

export function RoundSummaryModal({
  roundNumber,
  mode,
  selectorSeat,
  players,
  baseScores,
  multipliers,
  finalScores,
  onContinue,
}: RoundSummaryModalProps) {
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
          <p className="text-xs text-slate-400 mt-1">
            Selector ({players[selectorSeat]?.name}) receives <b>x2 Double Points</b>!
          </p>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 mb-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold uppercase text-slate-400">
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3 text-center">Base Score</th>
                <th className="py-2.5 px-3 text-center">Multiplier</th>
                <th className="py-2.5 px-3 text-right">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {players.map((p, idx) => {
                const isSelector = idx === selectorSeat;
                const base = baseScores[idx] ?? 0;
                const mult = multipliers[idx] ?? 1;
                const final = finalScores[idx] ?? 0;

                return (
                  <tr
                    key={p.seat}
                    className={`transition-colors ${
                      isSelector ? "bg-purple-950/30" : "hover:bg-slate-900/40"
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.avatar}</span>
                        <span className="font-semibold text-white truncate max-w-[120px]">
                          {p.name}
                        </span>
                        {isSelector && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-400/40">
                            Selector
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {base}
                    </td>
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
                    <td className="py-3 px-3 text-right font-mono font-bold text-base text-emerald-400">
                      +{final}
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
