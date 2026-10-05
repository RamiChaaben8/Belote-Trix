"use client";

import { motion } from "framer-motion";
import { cn, SUIT_SYMBOL } from "@/lib/utils";
import type { CardData } from "@/types";

interface Props {
  card?: CardData;
  hidden?: boolean;
  disabled?: boolean;
  highlight?: boolean;
  isWinning?: boolean;
  size?: "sm" | "md" | "lg";
  small?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  layoutId?: string;
}

export function PlayingCard({
  card,
  hidden,
  disabled,
  highlight,
  isWinning,
  size = "md",
  small,
  onClick,
  className,
  style,
  layoutId,
}: Props) {
  const effectiveSize = small ? "sm" : size;
  const red = card && (card.suit === "H" || card.suit === "D");

  // Realistic card proportions (ratio ~ 1.45)
  const sizeClasses =
    effectiveSize === "sm"
      ? "w-11 h-16 text-xs rounded-md"
      : effectiveSize === "lg"
      ? "w-20 h-28 sm:w-24 sm:h-36 md:w-26 md:h-38 text-lg sm:text-xl rounded-xl"
      : "w-16 h-24 sm:w-20 sm:h-28 md:w-22 md:h-32 text-base sm:text-lg rounded-lg";

  if (hidden || !card) {
    return (
      <div
        style={style}
        className={cn(
          sizeClasses,
          "relative select-none border-2 border-amber-300/40 shadow-xl overflow-hidden flex items-center justify-center",
          "bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-950",
          className
        )}
        aria-label="hidden card"
      >
        <div className="absolute inset-1 border border-amber-300/20 rounded-md bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px] opacity-40" />
        <div className="relative text-amber-300/50 font-serif font-black text-xs sm:text-sm tracking-widest uppercase">
          TRIX
        </div>
      </div>
    );
  }

  const cardContent = (
    <div
      style={style}
      data-testid={`card-${card.rank}${card.suit}`}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        sizeClasses,
        "relative select-none flex flex-col justify-between p-1.5 font-bold transition-all duration-200",
        "bg-gradient-to-b from-white via-slate-50 to-slate-100 border",
        red ? "text-rose-600" : "text-slate-950",
        highlight && "ring-4 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.9)] border-emerald-300",
        isWinning && "ring-4 ring-yellow-400 border-yellow-300 shadow-[0_0_35px_rgba(250,204,21,1)] animate-pulse",
        !highlight && !isWinning && "border-slate-300/90 shadow-md",
        onClick && !disabled && "cursor-pointer hover:shadow-2xl hover:border-emerald-400",
        disabled && onClick && "opacity-40 grayscale contrast-75 cursor-not-allowed",
        className
      )}
    >
      {/* Top Left Rank + Suit */}
      <div className="flex flex-col items-center leading-tight">
        <span className="font-black tracking-tighter text-sm sm:text-base md:text-lg">
          {card.rank}
        </span>
        <span className="text-xs sm:text-sm md:text-base -mt-1">
          {SUIT_SYMBOL[card.suit]}
        </span>
      </div>

      {/* Center Belote Suit Symbol */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <span className="text-4xl sm:text-6xl font-black">
          {SUIT_SYMBOL[card.suit]}
        </span>
      </div>

      {/* Bottom Right Rank + Suit (Inverted) */}
      <div className="flex flex-col items-center self-end rotate-180 leading-tight">
        <span className="font-black tracking-tighter text-sm sm:text-base md:text-lg">
          {card.rank}
        </span>
        <span className="text-xs sm:text-sm md:text-base -mt-1">
          {SUIT_SYMBOL[card.suit]}
        </span>
      </div>
    </div>
  );

  if (layoutId) {
    return (
      <motion.div layoutId={layoutId} className="relative inline-block">
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
