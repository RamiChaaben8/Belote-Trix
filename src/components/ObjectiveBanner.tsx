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
  if (mode === "Turns") {
    // Check for Capot: winner seat has score === -100
    const capotWinner = scores.findIndex((s) => s === -100);
    if (capotWinner !== -1) {
      return {
        emoji: "🏆",
        title: "CAPOT",
        color: "from-amber-400 to-yellow-300",
        glow: "rgba(251,191,36,0.95)",
        border: "border-yellow-400",
        bg: "bg-amber-950/95",
        winnerSeat: capotWinner,
        baseScore: 0,
        finalScore: -100,
        multiplier: 1,
        isCapot: true as const,
      };
    }
    return {
      emoji: "🔄",
      title: "TURNS COMPLETED",
      color: "from-teal-400 to-emerald-400",
      glow: "rgba(45,212,191,0.8)",
      border: "border-teal-400",
      bg: "bg-teal-950/95",
      winnerSeat,
      baseScore,
      finalScore,
      multiplier,
      isCapot: false as const,
    };
  }
  if (mode === "General") {
    const capotWinner = (banner as RoundFinishedPayload).generalBreakdown?.findIndex((b) => b.capot === -1000) ?? -1;
    return capotWinner >= 0
      ? {
          emoji: "🏆", title: "CAPOT", color: "from-amber-400 to-yellow-300",
          glow: "rgba(251,191,36,0.95)", border: "border-yellow-400", bg: "bg-amber-950/95",
          winnerSeat: capotWinner, baseScore: base[capotWinner], finalScore: scores[capotWinner], multiplier: capotWinner === selector ? 2 : 1, isCapot: true as const,
        }
      : {
          emoji: "🌟", title: "GENERAL COMPLETED", color: "from-cyan-400 to-emerald-400",
          glow: "rgba(45,212,191,0.85)", border: "border-emerald-400", bg: "bg-emerald-950/95",
          winnerSeat, baseScore, finalScore, multiplier,
        };
  }
  if (mode === "LastTrick" || endReason === "Last Trick Won") {
    return {
      emoji: "🏆",
      title: "LAST TRICK WON",
      color: "from-orange-400 to-rose-400",
      glow: "rgba(251,113,133,0.85)",
      border: "border-rose-400",
      bg: "bg-rose-950/95",
      winnerSeat,
      baseScore,
      finalScore,
      multiplier,
    };
  }
  if (mode === "Trix" || endReason === "Trix Finished") {
    // First finisher has base === -100
    const trixFirst = base.findIndex((b) => b === -100);
    const trixSecond = base.findIndex((b) => b === -50);
    return {
      emoji: "🃏",
      title: "TRIX FINISHED",
      color: "from-violet-400 to-purple-400",
      glow: "rgba(167,139,250,0.85)",
      border: "border-violet-400",
      bg: "bg-violet-950/95",
      winnerSeat: trixFirst >= 0 ? trixFirst : winnerSeat,
      baseScore: trixFirst >= 0 ? -100 : 0,
      finalScore: trixFirst >= 0 ? scores[trixFirst] : 0,
      multiplier: 1,
      trixSecond,
    };
  }
  // FiftyOne — handled separately, shouldn't reach here
  return null;
}

export function ObjectiveBanner({ banner, names, selectorSeat }: Props) {
  const content = banner ? getBannerContent(banner) : null;

  // For Turns mode show a simplified "completed" banner — all players score
  const isTurns = banner?.mode === "Turns";
  const isCapot = content && "isCapot" in content && content.isCapot;
  const isTrix = banner?.mode === "Trix" || banner?.endReason === "Trix Finished";
  const trixSecond = content && "trixSecond" in content ? (content.trixSecond as number) : -1;

  return (
    <AnimatePresence>
      {banner && content && (
        <motion.div
          key={`banner-${banner.roundNumber}`}
          initial={{ opacity: 0, scale: 0.75, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -20 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="absolute inset-0 z-[45] flex items-center justify-center pointer-events-none"
        >
          {/* Subtle backdrop — matches the felt's rounded corners */}
          <div
            className="absolute inset-0 bg-slate-950/50"
            style={{ borderRadius: "clamp(1.5rem, 4.5vmin, 4.5rem)" }}
          />

          {/* Banner card */}
          <motion.div
            className={`relative flex flex-col items-center gap-3 px-8 py-6 rounded-3xl ${content.bg} border-2 ${content.border} shadow-2xl`}
            style={{ boxShadow: `0 0 60px ${content.glow}` }}
          >
            {/* Animated emoji */}
            <motion.span
              className="text-5xl sm:text-6xl"
              animate={isCapot
                ? { scale: [1, 1.35, 1, 1.2, 1], rotate: [0, -12, 12, -6, 0] }
                : { scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }
              }
              transition={{ duration: isCapot ? 1.0 : 0.7, ease: "easeOut" }}
            >
              {isCapot ? "🏆" : content.emoji}
            </motion.span>

            {/* Title */}
            {isCapot ? (
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-2xl sm:text-3xl"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.5 }}
                >
                  🏆
                </motion.span>
                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 tracking-tight">
                  CAPOT
                </div>
                <motion.span
                  className="text-2xl sm:text-3xl"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.5, delay: 0.15 }}
                >
                  🏆
                </motion.span>
              </div>
            ) : (
              <div className={`text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${content.color} tracking-tight text-center`}>
                {content.title}
              </div>
            )}

            {/* Capot content */}
            {isCapot && banner ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="text-base font-bold text-white text-center">
                  <span className="text-amber-300">
                    {names[content.winnerSeat] ?? `Seat ${content.winnerSeat + 1}`}
                  </span>
                  {" "}won{" "}
                  <span className="text-yellow-300 font-black">ALL 8 tricks</span>
                </div>
                <div className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
                  Capot Bonus Activated
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm font-mono">
                  <span className="text-rose-400 font-black">
                    {names[content.winnerSeat] ?? `Seat ${content.winnerSeat + 1}`}: −100
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-emerald-400 font-bold">Others: +100</span>
                </div>
              </div>
            ) : isTrix && banner && content ? (
              /* Trix finish display */
              <div className="flex flex-col items-center gap-2 w-full text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">1st Place</span>
                    <span className="font-black text-white">
                      {names[content.winnerSeat] ?? `Seat ${content.winnerSeat + 1}`}
                    </span>
                    <span className="font-mono text-rose-400 font-bold">{banner.scores[content.winnerSeat]}</span>
                  </div>
                  {trixSecond >= 0 && (
                    <>
                      <span className="text-slate-600 text-lg">›</span>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">2nd Place</span>
                        <span className="font-black text-white">
                          {names[trixSecond] ?? `Seat ${trixSecond + 1}`}
                        </span>
                        <span className="font-mono text-rose-300 font-bold">{banner.scores[trixSecond]}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : isTurns && banner ? (
              /* Normal Turns: show all trick counts */
              <div className="flex flex-col gap-1 w-full text-sm">
                {[0, 1, 2, 3].map((seat) => {
                  const tricks = (banner.base[seat] ?? 0) / 10;
                  return tricks > 0 ? (
                    <div key={seat} className="flex items-center justify-between gap-4 px-2">
                      <span className="font-bold text-white truncate max-w-[100px]">
                        {names[seat] ?? `Seat ${seat + 1}`}
                        {seat === selectorSeat && (
                          <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-purple-900 text-purple-300 border border-purple-500/40">×2</span>
                        )}
                      </span>
                      <span className="font-mono text-amber-300 font-bold">{tricks} trick{tricks !== 1 ? "s" : ""}</span>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              /* Non-Turns: single winner display */
              <>
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
              </>
            )}

          {/* Pulsing hint */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-1"
            >
              {isTurns || isTrix ? "Round complete…" : "Collecting trick…"}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
