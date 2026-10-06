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

/*
 * Card size "md" is pinned to 72×104px (see PlayingCard.tsx).
 *
 * Container height budget (pixels from top of container):
 *   card top edge   =  28px  (so card bottom = 28 + 104 = 132px)
 *   container total = 160px  (card bottom 132 + 28px breathing at the bottom)
 *
 * The parent gives pb-6 (24px), so the container bottom is 24px above the
 * viewport floor — cards are always fully visible.
 *
 * Hover lift: y moves from 28 → 4 (−24px), so top edge = 4px, well inside 160px.
 * Selected lift: y moves from 28 → 0 (−28px), same.
 */

const CARD_W = 72;   // px — matches w-[72px] in PlayingCard
const CARD_H = 104;  // px — matches h-[104px] in PlayingCard
const CONTAINER_H = 160;
const BOTTOM_MARGIN = CONTAINER_H - CARD_H; // = 56px → card top rests at y=28 (centre of 56 split)
const REST_Y = Math.floor(BOTTOM_MARGIN / 2); // = 28

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

  // Shallow fan: max 8° total, ~1° per card
  const totalArc = Math.min(8, count * 1.0);
  const angleStep = count > 1 ? totalArc / (count - 1) : 0;
  const startAngle = -totalArc / 2;

  // Horizontal spacing: tighter with more cards
  const xStep = count >= 7 ? 46 : count >= 5 ? 52 : 60;

  return (
    <div
      className="relative w-full max-w-4xl"
      style={{ height: CONTAINER_H }}
    >
      {cards.map((card, idx) => {
        const rotation = startAngle + idx * angleStep;

        // Very subtle centre-dip: middle cards sit ~4px lower than edge cards
        const norm = count > 1 ? (idx - (count - 1) / 2) / ((count - 1) / 2) : 0;
        const droop = (1 - Math.abs(norm)) * 4; // max 4px droop at centre

        const xOffset = (idx - (count - 1) / 2) * xStep;

        const legal = isCardLegal(card);
        const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
        const canPlay = isMyTurn && legal && !disabled;

        const restY = REST_Y + droop;

        return (
          <motion.div
            key={`${card.rank}-${card.suit}`}
            layout
            initial={{ y: CONTAINER_H + 20, opacity: 0 }}
            animate={{
              x: xOffset,
              y: isSelected ? restY - 32 : restY,
              rotate: rotation,
              opacity: 1,
            }}
            whileHover={
              canPlay
                ? {
                    y: restY - 26,
                    scale: 1.08,
                    zIndex: 60,
                    transition: { duration: 0.1 },
                  }
                : undefined
            }
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              marginLeft: -(CARD_W / 2), // -36px: horizontally centred before xOffset
              zIndex: isSelected ? 50 : idx + 1,
              transformOrigin: "bottom center",
            }}
            className="select-none"
          >
            <PlayingCard
              card={card}
              size="md"
              onClick={canPlay ? () => onCardClick(card) : undefined}
              disabled={!canPlay && isMyTurn}
              highlight={legal && isMyTurn}
              className={
                canPlay
                  ? "ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.75)] border-emerald-300 cursor-pointer"
                  : isMyTurn
                  ? "opacity-40 grayscale cursor-not-allowed"
                  : "cursor-pointer"
              }
            />
          </motion.div>
        );
      })}
    </div>
  );
}
