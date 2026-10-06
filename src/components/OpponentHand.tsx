"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "./PlayingCard";

interface OpponentHandProps {
  cardCount: number;
  position: "top" | "left" | "right";
  isThinking?: boolean;
  isCurrentTurn?: boolean;
}

export function OpponentHand({ cardCount, position, isThinking, isCurrentTurn }: OpponentHandProps) {
  if (cardCount <= 0) return null;

  const cards = Array.from({ length: Math.min(cardCount, 8) });

  const handContent = position === "top" ? (
    <div className="flex -space-x-8 sm:-space-x-10 items-center justify-center">
      {cards.map((_, i) => {
        const isSelected = isThinking && i === Math.floor(cards.length / 2);
        return (
          <motion.div
            key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: isSelected ? 12 : 0,
              scale: isSelected ? 1.15 : 1,
              opacity: 1,
            }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 20 }}
            className={isSelected ? "z-30 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" : ""}
          >
            <PlayingCard hidden small className={isSelected ? "ring-2 ring-amber-400" : ""} />
          </motion.div>
        );
      })}
    </div>
  ) : (
    <div className="flex flex-col -space-y-11 sm:-space-y-12 items-center justify-center">
      {cards.map((_, i) => {
        const isSelected = isThinking && i === Math.floor(cards.length / 2);
        return (
          <motion.div
            key={i}
            initial={{ x: position === "left" ? -20 : 20, opacity: 0 }}
            animate={{
              x: isSelected ? (position === "left" ? 12 : -12) : 0,
              scale: isSelected ? 1.15 : 1,
              opacity: 1,
            }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 20 }}
            className={`${position === "left" ? "rotate-90" : "-rotate-90"} ${
              isSelected ? "z-30 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" : ""
            }`}
          >
            <PlayingCard hidden small className={isSelected ? "ring-2 ring-amber-400" : ""} />
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div
      className={`transition-all duration-300 ${
        isCurrentTurn ? "opacity-100 filter-none" : "opacity-80 blur-[1px]"
      }`}
    >
      {handContent}
    </div>
  );
}
