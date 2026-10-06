"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import type { CardData } from "@/types";

interface SwitchRevealOverlayProps {
  countdown: number;
  selectorSeat: number;
  swapTarget: number;
  otherPair: [number, number];
  currentHand: CardData[];
  seatNames: string[];
  seatAvatars: string[];
  youSeat: number;
}

export function SwitchRevealOverlay({
  countdown,
  selectorSeat,
  swapTarget,
  otherPair,
  currentHand,
  seatNames,
  seatAvatars,
}: SwitchRevealOverlayProps) {
  const swapPairs: [number, number][] = [
    [selectorSeat, swapTarget],
    otherPair,
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg mx-4 rounded-3xl border-2 border-cyan-400/60 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/80 border border-cyan-400/60 mb-3">
            <span className="text-cyan-300 font-black text-xl">🔄</span>
            <span className="text-cyan-300 font-black text-lg tracking-wide">SWITCH MODE</span>
          </div>
          <p className="text-slate-300 text-sm">Inspect your hand before the swap takes effect</p>
        </div>

        {/* Countdown circle */}
        <div className="flex justify-center mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-20 h-20 rounded-full bg-gradient-to-b from-cyan-900 to-slate-900 border-4 border-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.6)]"
            >
              <span className="text-3xl font-black text-cyan-300">{countdown}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-slate-400 mb-4 font-semibold">
          Hand Swap Starting In {countdown}…
        </p>

        {/* Swap pairs */}
        <div className="flex flex-wrap justify-center gap-3 mb-5">
          {swapPairs.map(([a, b], i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-sm"
            >
              <span className="text-lg">{seatAvatars[a] ?? "🙂"}</span>
              <span className="font-bold text-white">{seatNames[a] ?? `Seat ${a + 1}`}</span>
              <span className="text-cyan-400 font-black">↔</span>
              <span className="font-bold text-white">{seatNames[b] ?? `Seat ${b + 1}`}</span>
              <span className="text-lg">{seatAvatars[b] ?? "🙂"}</span>
            </div>
          ))}
        </div>

        {/* Current hand */}
        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 text-center">
            YOUR CURRENT HAND
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {currentHand.map((card, i) => (
              <div key={i} className="transform scale-75 origin-center">
                <PlayingCard card={card} size="md" />
              </div>
            ))}
            {currentHand.length === 0 && (
              <span className="text-slate-600 text-xs italic">No cards</span>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Cannot play cards during this phase. Waiting for countdown…
        </p>
      </motion.div>
    </div>
  );
}
