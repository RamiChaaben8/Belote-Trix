"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { RoundFinishedPayload } from "@/hooks/useRoom";

interface Props {
  banner: RoundFinishedPayload | null;
  /** Names indexed by seat */
  names: string[];
  selectorSeat: number | null;
}

function getBannerContent(banner: RoundFinishedPayload) {
  const { mode, endReason, base, scores, selector } = banner;

  // Find the winner (seat with non-zero base in trick modes)
  const winnerSeat = base.findIndex((b) => b > 0);
  const baseScore = winnerSeat >= 0 ? base[winnerSeat] : 0;
  const finalScore = winnerSeat >= 0 ? scores[winnerSeat] : 0;
  const isSelector = winnerSeat === selector;
  const multiplier = isSelector ? 2 : 1;

  if (mode === "KingOfHearts" || endReason === "King of Hearts Captured") {
    return {
      emoji: "👑",
      title: "KING OF HEARTS CAPTURED",
      color: "from-amber-500 to-yellow-400",
      glow: "rgba(251,191,36,0.8)",
      border: "border-yellow-400",
      bg: "bg-yellow-950/95",
      winnerSeat,
      baseScore,
      finalScore,
      multiplier,
    };
  }
  if (mode === "Queens" || endReason === "All Queens Captured") {
    return {
      emoji: "👸",
      title: "ALL QUEENS CAPTURED",
      color: "from-purple-500 to-violet-400",
      glow: "rgba(168,85,247,0.8)",
      border: "border-purple-400",
      bg: "bg-purple-950/95",
      winnerSeat,
      baseScore,
      finalScore,
      multiplier,
    };
  }
  if (mode === "Diamonds" || endReason === "All Diamonds Captured") {
    return {
      emoji: "♦",
      title: "ALL DIAMONDS COLLECTED",
      color: "from-sky-400 to-blue-400",
      glow: "rgba(56,189,248,0.8)",
      border: "border-sky-400",
      bg: "bg-sky-950/95",
      winnerSeat,
      baseScore,
      finalScore,
      multiplier,
    };
  }
  // FiftyOne — handled separately, shouldn't reach here
  return null;
}

export function ObjectiveBanner({ banner, names, selectorSeat }: Props) {
  const content = banner ? getBannerContent(banner) : null;

  return (
    <AnimatePresence>
      {banner && content && (
        <motion.div
          key={`banner-${banner.roundNumber}`}
          initial={{ opacity: 0, scale: 0.75, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -20 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="absolute inset-0 z-45 flex items-center justify-center pointer-events-none"
        >
          {/* Subtle backdrop */}
          <div className="absolute inset-0 bg-slate-950/50 rounded-[4.5rem] sm:rounded-[6rem]" />

          {/* Banner card */}
          <motion.div
            className={`relative flex flex-col items-center gap-3 px-8 py-6 rounded-3xl ${content.bg} border-2 ${content.border} shadow-2xl`}
            style={{ boxShadow: `0 0 60px ${content.glow}` }}
          >
            {/* Animated emoji */}
            <motion.span
              className="text-5xl sm:text-6xl"
              animate={{ scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {content.emoji}
            </motion.span>

            {/* Title */}
            <div className={`text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${content.color} tracking-tight text-center`}>
              {content.title}
            </div>

            {/* Winner */}
            {content.winnerSeat >= 0 && (
              <div className="text-sm font-bold text-white">
                Winner:{" "}
                <span className="text-amber-300">
                  {names[content.winnerSeat] ?? `Seat ${content.winnerSeat + 1}`}
                </span>
                {content.winnerSeat === selectorSeat && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-900 text-purple-300 border border-purple-500/40">
                    Selector ×2
                  </span>
                )}
              </div>
            )}

            {/* Score breakdown */}
            {content.baseScore > 0 && (
              <div className="flex items-center gap-3 text-sm font-mono">
                <span className="text-slate-400">Base:</span>
                <span className="text-white font-bold">+{content.baseScore}</span>
                {content.multiplier > 1 && (
                  <>
                    <span className="text-slate-500">×</span>
                    <span className="text-purple-300 font-bold">{content.multiplier}</span>
                    <span className="text-slate-500">=</span>
                    <span className="text-emerald-300 font-black text-base">+{content.finalScore}</span>
                  </>
                )}
              </div>
            )}

            {/* Pulsing "collecting…" hint */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-1"
            >
              Collecting trick…
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
