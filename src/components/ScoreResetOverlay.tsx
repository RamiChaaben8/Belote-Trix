"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ScoreResetPayload } from "@/hooks/useRoom";

interface ScoreResetOverlayProps {
  /** Resets fired during the round that just finished (may hold several seats). */
  resets: ScoreResetPayload[];
  /** Player names indexed by seat. */
  names: string[];
}

/**
 * Global Rule #2 — ⚡ SCORE RESET ⚡
 *
 * Full-screen celebration shown for ~2.8 seconds whenever a player's total
 * lands on an exact multiple of 1000 (positive or negative) and is wiped
 * back to 0. Renders above every other overlay (z-[60] > modal z-50).
 */
export function ScoreResetOverlay({ resets, names }: ScoreResetOverlayProps) {
  return (
    <AnimatePresence>
      {resets.length > 0 && (
        <motion.div
          key={`score-reset-${resets.map((r) => `${r.seat}-${r.reached}`).join("_")}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 p-4 bg-slate-950/80 backdrop-blur-sm pointer-events-none"
          data-testid="score-reset-overlay"
        >
          {resets.map((reset) => (
            <motion.div
              key={`${reset.seat}-${reset.reached}`}
              initial={{ scale: 0.7, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex flex-col items-center gap-2 px-6 sm:px-10 py-6 rounded-3xl bg-amber-950/95 border-2 border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.55)]"
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                className="text-2xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200"
              >
                ⚡ SCORE RESET ⚡
              </motion.div>

              <div className="text-sm sm:text-base text-slate-200 font-semibold">
                Player:{" "}
                <span className="font-black text-white">
                  {names[reset.seat] ?? `Seat ${reset.seat + 1}`}
                </span>
              </div>

              <div className="text-sm font-mono text-slate-300">
                Reached:{" "}
                <span className="font-black text-amber-300">{reset.reached}</span>
              </div>

              <div className="text-sm font-mono text-slate-300">
                Score reset to:{" "}
                <span className="font-black text-emerald-300">{reset.total}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
