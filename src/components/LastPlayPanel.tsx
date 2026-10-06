"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import type { CardData } from "@/types";

export interface LastTrickItem {
  winner: number;
  winnerName: string;
  plays: { seat: number; card: CardData; name: string }[];
}

interface Props {
  lastTrick: LastTrickItem | null;
  mode: string;
}

export function LastPlayPanel({ lastTrick, mode }: Props) {
  if (mode === "FiftyOne") return null;

  return (
    <div
      data-testid="last-play-panel"
      className="last-play absolute bottom-2 right-2 z-[3] select-none pointer-events-auto"
      style={{ width: "clamp(150px, 30cqw, 300px)" }}
    >
      <div className="rounded-2xl bg-slate-950/95 border border-amber-500/50 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col">
        {/* Gold Header */}
        <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.6)]">
            LAST TRICK
          </span>
          {lastTrick && (
            <span className="text-[10px] font-bold text-amber-300/90 truncate max-w-[170px] flex items-center gap-1">
              <span>🏆 Winner:</span>
              <span className="text-white font-extrabold">{lastTrick.winnerName}</span>
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="p-2.5 flex flex-col items-center justify-center min-h-[105px]">
          {!lastTrick || lastTrick.plays.length === 0 ? (
            <div className="text-center py-4 text-[11px] text-slate-500 font-medium italic">
              No tricks completed yet
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-1.5">
              {/* Winner Name Banner (large subtitle if needed) */}
              <div className="w-full flex items-center justify-between px-1 text-[11px]">
                <span className="text-slate-400 text-[10px]">Cards Played</span>
                <span className="text-amber-300 font-bold text-[11px] flex items-center gap-1">
                  <span>🏆</span>
                  <span>{lastTrick.winnerName} won</span>
                </span>
              </div>

              {/* 4 Real Card Graphics (Mini scale) */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full justify-items-center">
                {lastTrick.plays.map((p, idx) => {
                  const isWinningCard = p.seat === lastTrick.winner;

                  return (
                    <motion.div
                      key={`${p.seat}-${p.card.rank}${p.card.suit}-${idx}`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-1 w-full"
                    >
                      {/* Mini Card container */}
                      <div
                        className={`relative rounded-md transition-all ${
                          isWinningCard
                            ? "ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.85)] scale-105"
                            : "opacity-95"
                        }`}
                      >
                        <PlayingCard
                          card={p.card}
                          size="sm"
                          isWinning={isWinningCard}
                        />
                      </div>

                      {/* Player Name */}
                      <span
                        className={`text-[9px] font-semibold truncate max-w-[60px] text-center leading-tight ${
                          isWinningCard
                            ? "text-amber-300 font-bold"
                            : "text-slate-400"
                        }`}
                      >
                        {p.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
