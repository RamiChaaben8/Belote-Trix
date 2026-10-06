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
  isThinking?: boolean;
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
  isThinking,
  isDealer,
  isSelector,
  cardCount,
  position,
}: PlayerPodProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none z-20 pointer-events-none transition-all duration-300",
        position === "bottom" && "mb-1",
        position === "top" && "mt-1",
        position === "left" && "ml-1",
        position === "right" && "mr-1",
        isCurrentTurn ? "opacity-100 filter-none" : "opacity-80 blur-[1px]"
      )}
    >
      {/* Name and Selector/Dealer Badges */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className={cn(
            "text-xs sm:text-sm font-black tracking-tight transition-all",
            isCurrentTurn
              ? "text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-105"
              : "text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          )}
        >
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

      {/* Clean Avatar Circle with glowing ring on turn */}
      <div className="relative">
        <motion.div
          animate={{
            scale: isCurrentTurn ? [1, 1.08, 1] : 1,
            boxShadow: isCurrentTurn
              ? [
                  "0 0 15px rgba(251, 191, 36, 0.7)",
                  "0 0 30px rgba(251, 191, 36, 1)",
                  "0 0 15px rgba(251, 191, 36, 0.7)",
                ]
              : "0 4px 10px rgba(0, 0, 0, 0.5)",
          }}
          transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1.4, ease: "easeInOut" }}
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl border-2 transition-all",
            isCurrentTurn
              ? "border-amber-300 bg-emerald-950 ring-4 ring-amber-400/50"
              : "border-white/70 bg-slate-900/90 shadow-md"
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

        {/* Turn / Thinking banner chip */}
        {isThinking ? (
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[9px] uppercase tracking-wider shadow-md whitespace-nowrap flex items-center gap-1 z-30 border border-purple-300">
            <span className="flex gap-0.5 items-center">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-white inline-block"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </span>
            <span>Thinking…</span>
          </div>
        ) : isCurrentTurn ? (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md whitespace-nowrap">
            TURN
          </div>
        ) : null}
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
