"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "@/components/PlayingCard";
import type { TrixTable } from "@/game-engine/modes";
import type { Suit, Rank, CardData, Move } from "@/types";

// Card order in each column: A at top, 7 at bottom — displayed top-to-bottom as A, K, Q, J, 10, 9, 8, 7
const TRIX_RANKS_TOP_DOWN: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7"];
// Index in the engine's rank array (7=0 … A=7) for range comparison
const RANK_IDX: Record<Rank, number> = {
  "7": 0, "8": 1, "9": 2, "10": 3, "J": 4, "Q": 5, "K": 6, "A": 7,
};

interface TrixCenterProps {
  table: TrixTable;
  extraTurnSeat: number | null;
  names: string[];
  finishOrder: number[];
  yourSeat: number;
  lastPlayedCard?: CardData | null;
  legalMoves?: Move[];
}

/**
 * Trix board — 4 suit lanes (♦ ♣ ♥ ♠ left to right), Jack-centred progression
 * A K Q J 10 9 8 7 with fixed rank slots.
 *
 * Container:
 *   position: relative; container-type: size; min-width: 0; min-height: 0; overflow: hidden;
 * Sizing:
 *   --card-h = (laneHeight - headerHeight) / (8 * 0.62 + 0.38)
 *   --card-w = min(--card-h * 0.7, laneWidth - 4px)
 */
export function TrixCenter({
  table,
  extraTurnSeat,
  names,
  finishOrder,
  yourSeat,
  lastPlayedCard,
  legalMoves = [],
}: TrixCenterProps) {
  // Suit order: ♦ Diamonds, ♣ Clubs, ♥ Hearts, ♠ Spades (left to right)
  const suits: Suit[] = ["D", "C", "H", "S"];
  const suitMeta: Record<Suit, { symbol: string; colorClass: string; name: string }> = {
    D: { symbol: "♦", colorClass: "text-red-500", name: "Diamonds" },
    C: { symbol: "♣", colorClass: "text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]", name: "Clubs" },
    H: { symbol: "♥", colorClass: "text-red-500", name: "Hearts" },
    S: { symbol: "♠", colorClass: "text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]", name: "Spades" },
  };

  // Determine playable suits for the current player's legal moves
  const playableSuits = new Set<Suit>(legalMoves.map((m) => m.card.suit));

  // Count total cards remaining in the deck (32 total - all cards currently placed in table)
  let playedCount = 0;
  for (const s of suits) {
    const range = table[s];
    if (range !== null) {
      playedCount += (range.high - range.low + 1);
    }
  }
  const remainingCount = Math.max(0, 32 - playedCount);

  return (
    <div className="trix-center fixed z-[20] flex flex-col items-center justify-center select-none pointer-events-none">
      {/* Deck / Stack indicator — tucked neatly in the top-left corner */}
      <div
        className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700/60 shadow-lg text-[10px] text-slate-300 font-mono"
        title={`${remainingCount} cards remaining in play`}
      >
        <span className="text-amber-400 font-bold">🂠</span>
        <span>{remainingCount}/32</span>
      </div>

      {/* Extra-turn banner — top-center corner of the center zone */}
      <AnimatePresence>
        {extraTurnSeat !== null && (
          <div className="absolute top-2 inset-x-0 z-50 flex justify-center pointer-events-none">
            <motion.div
              key={`extra-${extraTurnSeat}`}
              initial={{ opacity: 0, y: -10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] shadow-[0_0_16px_rgba(251,191,36,0.9)] border border-yellow-200 whitespace-nowrap"
            >
              <span>🂡</span>
              <span>EXTRA TURN — {names[extraTurnSeat] ?? `Seat ${extraTurnSeat + 1}`}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4 separate suit lanes in a grid filling 90% width and 95% height */}
      <div
        className="grid grid-cols-4 items-stretch justify-items-center"
        style={{
          width: "var(--trix-board-w)",
          height: "var(--trix-board-h)",
          gap: "var(--trix-lane-gap)",
        }}
      >
        {suits.map((suit) => {
          const range = table[suit];
          const low = range?.low ?? null;
          const high = range?.high ?? null;
          const meta = suitMeta[suit];
          const isPlayableLane = playableSuits.has(suit);

          return (
            <div
              key={suit}
              className={`pointer-events-none w-full h-full flex flex-col items-center rounded-xl transition-all duration-200 p-1 ${
                isPlayableLane
                  ? "ring-1 ring-emerald-400/80 bg-emerald-950/20 shadow-[0_0_12px_rgba(52,211,153,0.25)]"
                  : "bg-slate-950/15"
              }`}
            >
              {/* Suit header: large 28-32px real red/black suit icon */}
              <div
                className="w-full flex items-center justify-center select-none shrink-0"
                style={{ height: "var(--trix-header-h)" }}
              >
                <span
                  className={`text-[28px] sm:text-[32px] leading-none font-bold ${meta.colorClass}`}
                  aria-label={meta.name}
                >
                  {meta.symbol}
                </span>
              </div>

              {/* 8 fixed rank slots: A K Q J 10 9 8 7
                  Each played card occupies its own fixed slot so ranks never shift or hide. */}
              <div
                className="w-full flex-1 relative flex flex-col items-center"
                style={{ height: "var(--trix-lane-usable-h)" }}
              >
                {TRIX_RANKS_TOP_DOWN.map((rank, slotIndex) => {
                  const idx = RANK_IDX[rank];
                  const played = low !== null && idx >= low && idx <= high!;
                  const isLastPlayed =
                    played &&
                    lastPlayedCard?.suit === suit &&
                    lastPlayedCard?.rank === rank;
                  const isJack = played && rank === "J";

                  // Offset from top for slot = slotIndex * (0.62 * card-h)
                  const topOffset = `calc(${slotIndex} * (var(--card-h) * 0.62))`;
                  const zIndex = slotIndex + 1;

                  return (
                    <div
                      key={rank}
                      style={{
                        position: "absolute",
                        top: topOffset,
                        width: "var(--card-w)",
                        height: "var(--card-h)",
                        zIndex: isLastPlayed ? 30 : zIndex,
                      }}
                      className="flex items-center justify-center"
                    >
                      {played ? (
                        <motion.div
                          initial={{ scale: 0.75, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                          className="w-full h-full"
                        >
                          <PlayingCard
                            card={{ suit, rank }}
                            size="sm"
                            hideBottomRank
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                            className={`w-full h-full ${
                              isLastPlayed
                                ? "ring-2 ring-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.9)] border-amber-300"
                                : isJack
                                ? "ring-1 ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                                : "shadow-sm"
                                }`}
                          />
                        </motion.div>
                      ) : (
                        <span className="text-[9px] text-slate-500/30 font-mono font-bold select-none">
                          {rank}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish order — bottom-left corner chip of the center zone */}
      {finishOrder.length > 0 && (
        <div className="absolute bottom-2 left-2 z-40 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/85 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] max-w-[calc(100%-16px)] flex-wrap shadow-lg">
          <span>🏁</span>
          {finishOrder.map((s, i) => (
            <span key={s}>
              {i > 0 && <span className="text-slate-500 mx-0.5">›</span>}
              <span className={s === yourSeat ? "text-amber-300 font-extrabold" : "text-white"}>
                {names[s]?.split(" ")[0] ?? `S${s + 1}`}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
