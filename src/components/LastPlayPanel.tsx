"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import { SUIT_SYMBOL } from "@/lib/utils";
import type { CardData } from "@/types";

export interface LastTrickDisplay {
  winner: number;
  winnerName: string;
  plays: { seat: number; card: CardData; name: string }[];
  /** Cards that are "objective" cards for this mode — get a special highlight */
  highlightCards?: CardData[];
  trickIndex: number;
}

interface Props {
  trick: LastTrickDisplay | null;
  mode: string;
}

function isObjectiveCard(card: CardData, mode: string): boolean {
  if (mode === "KingOfHearts") return card.suit === "H" && card.rank === "K";
  if (mode === "Diamonds") return card.suit === "D";
  if (mode === "Queens") return card.rank === "Q";
  return false;
}

function modeLabel(mode: string): string {
  if (mode === "KingOfHearts") return "♥ King of Hearts";
  if (mode === "Diamonds") return "♦ Diamonds";
  if (mode === "Queens") return "♛ Queens";
  return "Last Play";
}

export function LastPlayPanel({ trick, mode }: Props) {
  if (mode === "FiftyOne") return null;

  return (
    <div className="absolute bottom-4 right-4 z-30 select-none pointer-events-none">
      <AnimatePresence mode="wait">
        {trick && (
          <motion.div
            key={trick.trickIndex}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="rounded-2xl bg-slate-950/90 border border-amber-500/30 backdrop-blur-md shadow-2xl overflow-hidden"
            style={{ width: 168 }}
          >
            {/* Header */}
            <div className="px-3 py-1.5 border-b border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                {modeLabel(mode)}
              </span>
            </div>

            {/* Winner line */}
            <div className="px-3 pt-1.5 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🏆</span>
                <span className="text-[11px] font-bold text-amber-300 truncate">
                  {trick.winnerName} wins
                </span>
              </div>
            </div>

            {/* 2×2 card grid */}
            <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
              {trick.plays.map((p) => {
                const isObj = isObjectiveCard(p.card, mode);
                const isWinner = p.seat === trick.winner;
                const isRed = p.card.suit === "H" || p.card.suit === "D";

                return (
                  <motion.div
                    key={`${p.seat}-${p.card.rank}${p.card.suit}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.05 * trick.plays.indexOf(p) }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    {/* Compact card face */}
                    <div
                      className={`
                        relative w-14 h-[52px] rounded-lg flex flex-col justify-between p-1
                        bg-gradient-to-b from-white via-slate-50 to-slate-100 border
                        ${isObj
                          ? "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] ring-2 ring-amber-400"
                          : isWinner
                          ? "border-yellow-400/60 shadow-[0_0_6px_rgba(250,204,21,0.5)]"
                          : "border-slate-300/80 shadow-sm"
                        }
                      `}
                    >
                      {/* Top-left rank+suit */}
                      <div className={`flex items-center gap-0.5 leading-none ${isRed ? "text-rose-600" : "text-slate-900"}`}>
                        <span className="text-[11px] font-black">{p.card.rank}</span>
                        <span className="text-[10px]">{SUIT_SYMBOL[p.card.suit]}</span>
                      </div>
                      {/* Center suit watermark */}
                      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 ${isRed ? "text-rose-500" : "text-slate-700"}`}>
                        <span className="text-2xl">{SUIT_SYMBOL[p.card.suit]}</span>
                      </div>
                      {/* Bottom-right rank+suit (rotated) */}
                      <div className={`flex items-center gap-0.5 leading-none self-end rotate-180 ${isRed ? "text-rose-600" : "text-slate-900"}`}>
                        <span className="text-[11px] font-black">{p.card.rank}</span>
                        <span className="text-[10px]">{SUIT_SYMBOL[p.card.suit]}</span>
                      </div>
                    </div>
                    {/* Player name under card */}
                    <span className={`text-[9px] font-semibold truncate max-w-[56px] text-center leading-tight ${isWinner ? "text-amber-300" : "text-slate-500"}`}>
                      {p.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
