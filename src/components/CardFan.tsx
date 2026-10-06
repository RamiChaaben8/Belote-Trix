"use client";

import { useEffect, useRef, useState } from "react";
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
  isSelectingMode?: boolean;
}

/*
 * HOW CARD SIZE IS CALCULATED
 * ----------------------------
 * 1. We measure the fan container (ResizeObserver) and the viewport
 *    height.
 * 2. CARD_W is the smaller of a width-derived and a height-derived
 *    size:
 *      - width  → how big cards can be while the whole fan fits
 *                 inside the bottom zone (see step 3);
 *      - height → keeps the bottom zone from eating the center zone
 *                 (the Trix lanes shrink with cqh, but tiny centers
 *                 are unusable).
 * 3. Spacing: xStep = min(cardW * 0.78, leftoverWidth / (n-1)).
 *    That yields an even fan that always fits the measured width —
 *    no card ever leaves the bottom zone.
 * 4. Container height = CARD_H + 56 (28px rest offset top and bottom
 *    breathing room). Hover lifts −26px, selection lifts −32px; both
 *    stay inside the container.
 *
 * To tweak: change the size ladders below, `maxStep` (overlap
 * tightness) or REST_Y / the +56 container budget.
 */

const ASPECT = 104 / 72; // PlayingCard "md": 72×104

export function CardFan({
  cards,
  legalMoves,
  isMyTurn,
  selectedCard,
  onCardClick,
  disabled,
  isSelectingMode,
}: CardFanProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 900, h: 900 });

  const count = cards.length;

  // Re-measure whenever the hand appears/changes size (the fan mounts
  // with 0 cards while the deck is being dealt).
  useEffect(() => {
    const el = wrapRef.current;
    const apply = () =>
      setBox({ w: el?.clientWidth ?? 900, h: window.innerHeight || 900 });
    apply();
    const ro = new ResizeObserver(apply);
    if (el) ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [count]);

  if (count === 0) return null;

  const isCardLegal = (c: CardData): boolean => {
    if (!isMyTurn || isSelectingMode) return false;
    return legalMoves.some((m) => m.card.suit === c.suit && m.card.rank === c.rank);
  };

  // Size ladders (see header comment).
  const byWidth =
    box.w >= 1400 ? 112 : box.w >= 950 ? 96 : box.w >= 720 ? 84 : box.w >= 540 ? 76 : 64;
  const byHeight =
    box.h >= 900 ? 112 : box.h >= 780 ? 96 : box.h >= 680 ? 84 : box.h >= 560 ? 72 : 60;
  const CARD_W = Math.min(byWidth, byHeight);
  const CARD_H = Math.round(CARD_W * ASPECT);
  const CONTAINER_H = CARD_H + 56;
  const REST_Y = 28;

  // Even overlap that always fits the measured width.
  const maxStep = CARD_W * 0.70;
  const xStep =
    count > 1
      ? Math.max(16, Math.min(maxStep, (box.w - 24 - CARD_W) / (count - 1)))
      : 0;

  // Shallow fan: max 8° total, ~1° per card
  const totalArc = Math.min(8, count * 1.0);
  const angleStep = count > 1 ? totalArc / (count - 1) : 0;
  const startAngle = -totalArc / 2;

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: CONTAINER_H }}>
      {cards.map((card, idx) => {
        const rotation = startAngle + idx * angleStep;

        // Very subtle centre-dip: middle cards sit ~4px lower than edge cards
        const norm = count > 1 ? (idx - (count - 1) / 2) / ((count - 1) / 2) : 0;
        const droop = (1 - Math.abs(norm)) * 4; // max 4px droop at centre

        const xOffset = (idx - (count - 1) / 2) * xStep;

        const legal = isCardLegal(card);
        const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
        const canPlay = isMyTurn && legal && !disabled && !isSelectingMode;

        // Check if this is a Jack that should glow strongly
        const isGlowingJack = isMyTurn && card.rank === "J" && legal;

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
              canPlay || isSelectingMode
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
              marginLeft: -(CARD_W / 2), // horizontally centred before xOffset
              zIndex: isSelected ? 50 : idx + 1,
              transformOrigin: "bottom center",
            }}
            className="select-none"
          >
            <PlayingCard
              card={card}
              size="md"
              // Inline size wins over the fixed 72×104 classes so the fan
              // scales with the measured container.
              style={{ width: CARD_W, height: CARD_H }}
              onClick={canPlay ? () => onCardClick(card) : undefined}
              disabled={!canPlay && isMyTurn && !isSelectingMode}
              highlight={legal && isMyTurn}
              className={
                isGlowingJack
                  ? "ring-4 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,1)] border-emerald-300 cursor-pointer"
                  : canPlay
                  ? "ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.75)] border-emerald-300 cursor-pointer"
                  : isSelectingMode
                  ? "opacity-100 filter-none cursor-default shadow-md"
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
