"use client";

import { motion } from "framer-motion";
import { MODE_LABEL } from "@/lib/utils";

interface SwitchSwapAnimationProps {
  selectorSeat: number;
  swapTarget: number;
  otherPair: [number, number];
  seatNames: string[];
  seatAvatars: string[];
  subMode: string;
}

export function SwitchSwapAnimation({
  selectorSeat,
  swapTarget,
  otherPair,
  seatNames,
  seatAvatars,
  subMode,
}: SwitchSwapAnimationProps) {
  const swapPairs: [number, number][] = [
    [selectorSeat, swapTarget],
    otherPair,
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        className="w-full max-w-lg mx-4 rounded-3xl border-2 border-cyan-400/60 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-2xl text-center"
      >
        <div className="text-cyan-300 font-black text-2xl mb-2">🔄 Swapping Hands!</div>
        <div className="text-amber-300 font-bold text-sm mb-6">
          Now playing: {MODE_LABEL[subMode] ?? subMode}
        </div>

        <div className="flex flex-col gap-6">
          {swapPairs.map(([a, b], idx) => (
            <div key={idx} className="flex items-center justify-center gap-4">
              {/* Player A */}
              <div className="flex flex-col items-center gap-1 min-w-[70px]">
                <span className="text-3xl">{seatAvatars[a] ?? "🙂"}</span>
                <span className="text-sm font-bold text-white truncate max-w-[70px] text-center">
                  {seatNames[a] ?? `Seat ${a + 1}`}
                </span>
              </div>

              {/* Animated flying cards */}
              <div className="relative flex items-center justify-center w-32 h-10">
                {/* Card flying A → B */}
                <motion.div
                  animate={{ x: [0, 32, 64], opacity: [1, 0.7, 0], scale: [1, 0.8, 0.5] }}
                  transition={{ duration: 1.0, ease: "easeInOut", delay: idx * 0.2, repeat: Infinity, repeatDelay: 0.8 }}
                  className="absolute left-0 text-xl"
                >
                  🃏
                </motion.div>
                {/* Card flying B → A */}
                <motion.div
                  animate={{ x: [64, 32, 0], opacity: [1, 0.7, 0], scale: [1, 0.8, 0.5] }}
                  transition={{ duration: 1.0, ease: "easeInOut", delay: idx * 0.2 + 0.12, repeat: Infinity, repeatDelay: 0.8 }}
                  className="absolute right-0 text-xl"
                >
                  🃏
                </motion.div>
                <span className="text-cyan-400 font-black text-lg z-10">↔</span>
              </div>

              {/* Player B */}
              <div className="flex flex-col items-center gap-1 min-w-[70px]">
                <span className="text-3xl">{seatAvatars[b] ?? "🙂"}</span>
                <span className="text-sm font-bold text-white truncate max-w-[70px] text-center">
                  {seatNames[b] ?? `Seat ${b + 1}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-6">Starting in a moment…</p>
      </motion.div>
    </div>
  );
}
