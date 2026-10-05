"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "./PlayingCard";

interface OpponentHandProps {
  cardCount: number;
  position: "top" | "left" | "right";
}

export function OpponentHand({ cardCount, position }: OpponentHandProps) {
  if (cardCount <= 0) return null;

  const cards = Array.from({ length: Math.min(cardCount, 8) });

  if (position === "top") {
    return (
      <div className="flex -space-x-8 sm:-space-x-10 items-center justify-center">
        {cards.map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            <PlayingCard hidden small />
          </motion.div>
        ))}
      </div>
    );
  }

  // Left or right position (stacked vertically with slight fan or offset)
  return (
    <div className="flex flex-col -space-y-11 sm:-space-y-12 items-center justify-center">
      {cards.map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: position === "left" ? -20 : 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.03 }}
          className={position === "left" ? "rotate-90" : "-rotate-90"}
        >
          <PlayingCard hidden small />
        </motion.div>
      ))}
    </div>
  );
}
