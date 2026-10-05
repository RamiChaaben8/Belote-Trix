"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PlayerPodProps {
  seat: number;
  name: string;
  avatar: string;
  totalScore: number;
  isBot?: boolean;
  connected?: boolean;
  isCurrentTurn?: boolean;
  isDealer?: boolean;
  isSelector?: boolean;
  cardCount: number;
  position: "bottom" | "top" | "left" | "right";
}

export function PlayerPod({
  name,
  avatar,
  totalScore,
  isBot,
  connected = true,
  isCurrentTurn,
  isDealer,
  isSelector,
  cardCount,
  position,
}: PlayerPodProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none z-20 pointer-events-none",
        position === "bottom" && "mb-1",
        position === "top" && "mt-1",
        position === "left" && "ml-1",
        position === "right" && "mr-1"
      )}
    >
      {/* Name and Selector/Dealer Badges */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs sm:text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
          {name}
        </span>
        {isSelector && (
          <span
            title="Selector (x2 Points)"
            className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-600 text-white shadow uppercase border border-purple-300/40"
          >
            x2
          </span>
        )}
        {isDealer && (
          <span
            title="Dealer"
            className="w-4 h-4 rounded-full bg-blue-600 text-[9px] font-black text-white flex items-center justify-center shadow"
          >
            D
          </span>
        )}
      </div>

      {/* Clean Avatar Circle with subtle glowing ring on turn */}
      <div className="relative">
        <motion.div
          animate={{
            scale: isCurrentTurn ? [1, 1.08, 1] : 1,
            boxShadow: isCurrentTurn
              ? "0 0 20px rgba(251, 191, 36, 0.9)"
              : "0 4px 10px rgba(0, 0, 0, 0.5)",
          }}
          transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1.5 }}
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl border-2 transition-all",
            isCurrentTurn
              ? "border-amber-300 bg-emerald-950"
              : "border-white/80 bg-slate-900/90 shadow-md"
          )}
        >
          {avatar}
        </motion.div>

        {/* Offline indicator */}
        {!connected && (
          <span
            title="Disconnected"
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-900 animate-ping"
          />
        )}

        {/* Turn banner chip */}
        {isCurrentTurn && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md">
            TURN
          </div>
        )}
      </div>

      {/* Score & Card Count Pill */}
      <div className="flex items-center gap-1.5 mt-1 font-mono">
        <span
          title="Total Score (Lowest Wins)"
          className="text-xs sm:text-sm font-extrabold text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        >
          {totalScore} pts
        </span>
        {cardCount > 0 && (
          <span
            title={`${cardCount} cards remaining`}
            className="text-[10px] sm:text-xs text-emerald-200/90 font-bold drop-shadow"
          >
            ({cardCount}🂠)
          </span>
        )}
      </div>
    </div>
  );
}
