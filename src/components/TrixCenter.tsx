"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "@/components/PlayingCard";
import type { TrixTable } from "@/game-engine/modes";
import type { Suit, Rank } from "@/types";

// Card order in each column: 7 at bottom, A at top — displayed top-to-bottom as A…7
const TRIX_RANKS_TOP_DOWN: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7"];
// Index in the engine's rank array (7=0 … A=7) for range comparison
const RANK_IDX: Record<Rank, number> = {
  "7": 0, "8": 1, "9": 2, "10": 3, "J": 4, "Q": 5, "K": 6, "A": 7,
};

interface TrixCenterProps {
  table: TrixTable;
  extraTurnSeat: number | null;
  names: string[];
  finishOrder: number[];
  handCounts: number[];
  yourSeat: number;
}

export function TrixCenter({
  table,
  extraTurnSeat,
  names,
  finishOrder,
  handCounts,
  yourSeat,
}: TrixCenterProps) {
  // Suit order: ♦ Diamonds, ♣ Clubs, ♥ Hearts, ♠ Spades (left to right)
  const suits: Suit[] = ["D", "C", "H", "S"];
  const suitLabels: Record<string, { label: string; color: string }> = {
    D: { label: "♦", color: "text-sky-400" },
    C: { label: "♣", color: "text-emerald-400" },
    H: { label: "♥", color: "text-rose-400" },
    S: { label: "♠", color: "text-slate-300" },
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none">

      {/* Extra-turn banner */}
      <AnimatePresence>
        {extraTurnSeat !== null && (
          <motion.div
            key={`extra-${extraTurnSeat}`}
            initial={{ opacity: 0, y: -10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-9 z-50 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] shadow-[0_0_16px_rgba(251,191,36,0.9)] border border-yellow-200"
          >
            <span>🂡</span>
            <span>EXTRA TURN — {names[extraTurnSeat] ?? `Seat ${extraTurnSeat + 1}`}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 separate suit columns: ♦, ♣, ♥, ♠ from left to right */}
      <div className="flex items-start gap-2">
        {suits.map((suit) => {
          const range = table[suit];
          const low = range?.low ?? null;
          const high = range?.high ?? null;
          const suitInfo = suitLabels[suit];

          return (
            <div key={suit} className="flex flex-col items-center gap-0.5">
              {/* Suit header */}
              <span className={`text-xs font-black mb-0.5 ${suitInfo.color}`}>
                {suitInfo.label}
              </span>

              {/* Cards stacked vertically: A, K, Q, J, 10, 9, 8, 7 (J is center) */}
              {TRIX_RANKS_TOP_DOWN.map((rank) => {
                const idx = RANK_IDX[rank];
                const played = low !== null && idx >= low && idx <= high!;
                const isEdge = played && (idx === low || idx === high);
                // The Jack is the centre card of the column — give it a stronger glow.
                const isJack = played && rank === "J";

                if (played) {
                  return (
                    <motion.div
                      key={rank}
                      initial={isEdge ? { scale: 0.6, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={isEdge ? "z-10 relative" : "z-0 relative"}
                    >
                      <PlayingCard
                        card={{ suit, rank }}
                        size="sm"
                        className={
                          isJack
                            ? "ring-4 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)] border-emerald-300"
                            : isEdge
                            ? "ring-2 ring-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                            : "opacity-75 shadow-sm"
                        }
                      />
                    </motion.div>
                  );
                }

                // Empty slot
                return (
                  <div
                    key={rank}
                    className="w-11 h-16 rounded-md border border-dashed border-slate-700/40 bg-slate-900/10 flex items-center justify-center"
                  >
                    <span className="text-[8px] text-slate-700 font-mono">{rank}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Hand counts + finish order */}
      <div className="flex items-center gap-2 flex-wrap justify-center text-[10px]">
        {finishOrder.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            <span>🏁</span>
            {finishOrder.map((s, i) => (
              <span key={s}>
                {i > 0 && <span className="text-slate-500 mx-0.5">›</span>}
                <span className={s === yourSeat ? "text-amber-300" : "text-white"}>
                  {names[s]?.split(" ")[0] ?? `S${s + 1}`}
                </span>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3].map((s) =>
            handCounts[s] > 0 ? (
              <span
                key={s}
                className={`px-1 py-0.5 rounded font-mono font-bold text-[10px] ${
                  s === yourSeat
                    ? "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                    : "bg-slate-900/60 text-slate-500 border border-slate-800"
                }`}
              >
                {names[s]?.split(" ")[0] ?? `S${s + 1}`}:{handCounts[s]}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
