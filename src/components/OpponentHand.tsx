"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "./PlayingCard";

interface OpponentHandProps {
  cardCount: number;
  position: "top" | "left" | "right";
  isThinking?: boolean;
  isCurrentTurn?: boolean;
}

/**
 * Opponent hands hug their table edge inside the grid zone:
 *  - top:  horizontal row, cards overlap via .opp-gap-top (margin-left)
 *  - side: vertical stack rotated ±90°; .opp-hand-side fills the zone's
 *          leftover height and is a container, so card length, overlap
 *          and the number of visible backs scale with actual free space
 * True card counts always stay visible in the player's own pod pill.
 */
export function OpponentHand({ cardCount, position, isThinking, isCurrentTurn }: OpponentHandProps) {
  if (cardCount <= 0) return null;

  const cards = Array.from({ length: Math.min(cardCount, 8) });
  const middle = Math.floor(cards.length / 2);
  const rotate = position === "left" ? 90 : -90;

  const wrapperClass = `transition-all duration-300 ${
    isCurrentTurn ? "opacity-100 filter-none" : "opacity-80 blur-[1px]"
  }`;

  if (position === "top") {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-center">
          {cards.map((_, i) => {
            const isSelected = isThinking && i === middle;
            return (
              <motion.div
                key={i}
                initial={{ y: -16, opacity: 0 }}
                animate={{
                  y: isSelected ? 8 : 0,
                  scale: isSelected ? 1.12 : 1,
                  opacity: 1,
                }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 20 }}
                className={`relative ${i > 0 ? "opp-gap-top" : ""} ${
                  isSelected ? "z-30 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" : ""
                }`}
              >
                <PlayingCard
                  hidden
                  className={`opp-card-top ${isSelected ? "ring-2 ring-amber-400" : ""}`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Side hand: the root itself is .opp-hand-side — it fills the zone's
  // leftover height (pod + hand share the 1fr grid row) and is a size
  // container, so card length/overlap and how many backs are shown derive
  // from the actual free space — the stack can never overflow the cell.
  return (
    <div className={`${wrapperClass} opp-hand-side`}>
      {cards.map((_, i) => {
          const isSelected = isThinking && i === middle;
          return (
            <motion.div
              key={i}
              className={`opp-slot relative ${i > 0 ? "opp-gap-side" : ""} ${
                isSelected ? "z-30 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" : ""
              }`}
              initial={{ x: position === "left" ? -16 : 16, opacity: 0, rotate }}
              animate={{
                x: isSelected ? (position === "left" ? 10 : -10) : 0,
                y: 0,
                rotate,
                scale: isSelected ? 1.12 : 1,
                opacity: 1,
              }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 20 }}
            >
              <PlayingCard
                hidden
                className={`opp-card-side ${isSelected ? "ring-2 ring-amber-400" : ""}`}
              />
            </motion.div>
          );
        })}
    </div>
  );
}
