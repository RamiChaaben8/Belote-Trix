"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import type { CardData, Move } from "@/types";

interface CardFanProps {
  cards: CardData[];
  legalMoves: Move[];
  isMyTurn: boolean;
  selectedCard: CardData | null;
  onCardClick: (card: CardData) => void;
  disabled?: boolean;
}

export function CardFan({
  cards,
  legalMoves,
  isMyTurn,
  selectedCard,
  onCardClick,
  disabled,
}: CardFanProps) {
  const count = cards.length;
  if (count === 0) return null;

  const isCardLegal = (c: CardData): boolean => {
    if (!isMyTurn) return false;
    return legalMoves.some((m) => m.card.suit === c.suit && m.card.rank === c.rank);
  };

  // Small fan curve (only 1-2 degrees per card, virtually flat and realistic)
  const maxArcAngle = Math.min(16, count * 2);
  const angleStep = count > 1 ? maxArcAngle / (count - 1) : 0;
  const startAngle = -maxArcAngle / 2;

  return (
    <div className="relative flex justify-center items-end h-32 sm:h-38 md:h-44 w-full max-w-4xl px-2">
      <div className="relative flex justify-center items-end w-full">
        {cards.map((card, idx) => {
          const rotation = startAngle + idx * angleStep;
          // Very gentle parabola Y offset
          const normalizedIdx =
            count > 1 ? (idx - (count - 1) / 2) / ((count - 1) / 2) : 0;
          const yOffset = Math.abs(normalizedIdx) * 4;
          // Clean horizontal overlap
          const xOffset = (idx - (count - 1) / 2) * (count > 6 ? 42 : 52);

          const legal = isCardLegal(card);
          const isSelected =
            selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
          const canPlay = isMyTurn && legal && !disabled;

          return (
            <motion.div
              key={`${card.rank}-${card.suit}`}
              layout
              initial={{ y: 40, opacity: 0 }}
              animate={{
                y: isSelected ? -38 : yOffset,
                x: xOffset,
                rotate: rotation,
                opacity: 1,
              }}
              whileHover={
                canPlay
                  ? {
                      y: -32,
                      scale: 1.05,
                      zIndex: 60,
                      transition: { duration: 0.15 },
                    }
                  : undefined
              }
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              style={{
                position: "absolute",
                zIndex: isSelected ? 50 : idx + 1,
                transformOrigin: "bottom center",
              }}
              className="origin-bottom cursor-pointer select-none"
            >
              <PlayingCard
                card={card}
                size="lg"
                onClick={canPlay ? () => onCardClick(card) : undefined}
                disabled={!canPlay && isMyTurn}
                highlight={legal && isMyTurn}
                className={
                  legal && isMyTurn
                    ? "ring-4 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.9)] border-emerald-300"
                    : isMyTurn
                    ? "opacity-40 grayscale contrast-75 cursor-not-allowed"
                    : ""
                }
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
