"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import { FiftyOneCenter, type FiftyOneMove } from "./FiftyOneCenter";
import { MODE_LABEL } from "@/lib/utils";
import type { CardData, ModeId } from "@/types";

interface TrickPlay {
  seat: number;
  card: CardData;
}

interface CenterTrickProps {
  // State 1: Mode Selection
  isSelectingMode: boolean;
  isCurrentUserSelector: boolean;
  selectorName: string;
  remainingModes: ModeId[];
  onSelectMode: (mode: ModeId) => void;

  // State 2: Playing Tricks
  plays: TrickPlay[];
  youSeat: number;
  winnerSeat: number | null;
  winnerName: string | null;
  mode: string;
  fiftyTotal?: number;
  fiftyDirection?: 1 | -1;
  isCollecting?: boolean;

  // Fifty One extras
  fiftyMoves?: FiftyOneMove[];
  names?: string[];
  thinkingSeats?: number[];
  selectorSeat?: number | null;
  turnOrder?: number[];
}

export function CenterTrick({
  isSelectingMode,
  isCurrentUserSelector,
  selectorName,
  remainingModes,
  onSelectMode,
  plays,
  youSeat,
  winnerSeat,
  winnerName,
  mode,
  fiftyTotal,
  fiftyDirection,
  isCollecting,
  fiftyMoves,
  names,
  thinkingSeats,
  selectorSeat,
  turnOrder,
}: CenterTrickProps) {
  // Map absolute seat to relative table position
  // 0: bottom, 1: left, 2: top, 3: right (relative to youSeat)
  const getRelativePosition = (
    seat: number
  ): "bottom" | "left" | "top" | "right" => {
    const rel = (seat - youSeat + 4) % 4;
    switch (rel) {
      case 0:
        return "bottom";
      case 1:
        return "left";
      case 2:
        return "top";
      case 3:
        return "right";
      default:
        return "bottom";
    }
  };

  // Realistic natural landing positions in center with subtle rotations
  const positionOffsets: Record<
    "bottom" | "left" | "top" | "right",
    { x: number; y: number; rotate: number; startX: number; startY: number }
  > = {
    bottom: { x: 0, y: 70, rotate: 2, startX: 0, startY: 260 },
    top: { x: 0, y: -70, rotate: -3, startX: 0, startY: -260 },
    left: { x: -85, y: 0, rotate: 5, startX: -260, startY: 0 },
    right: { x: 85, y: 0, rotate: -4, startX: 260, startY: 0 },
  };

  const winnerExitTarget =
    winnerSeat !== null
      ? positionOffsets[getRelativePosition(winnerSeat)]
      : { x: 0, y: 0, rotate: 0, startX: 0, startY: 0 };

  return (
    <div className="relative flex items-center justify-center w-full max-w-lg h-72 sm:h-80 select-none pointer-events-none">
      {/* ========================================================= */}
      {/* STATE 1: LARGE CENTER MODE SELECTION                      */}
      {/* ========================================================= */}
      {isSelectingMode ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-30 pointer-events-auto flex flex-col items-center justify-center p-5 sm:p-7 rounded-3xl bg-slate-950/95 border-2 border-amber-400/50 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-sm sm:max-w-md text-center"
        >
          {isCurrentUserSelector ? (
            <>
              <div className="flex items-center gap-2 mb-1 text-amber-300 font-black text-base sm:text-lg">
                <span className="text-xl">👑</span>
                <span>Select Round Mode</span>
              </div>
              <p className="text-xs text-purple-300 font-semibold mb-4">
                You are Selector: Points for this mode will be <b>DOUBLED (x2)</b>!
              </p>

              <div className="grid grid-cols-2 gap-3 w-full">
                {remainingModes.map((m) => (
                  <motion.button
                    key={m}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    data-testid={`mode-${m}`}
                    onClick={() => onSelectMode(m)}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-purple-900/90 hover:to-indigo-900/90 border-2 border-slate-700 hover:border-purple-400 text-white shadow-xl transition-all"
                  >
                    <span className="font-extrabold text-sm sm:text-base">
                      {MODE_LABEL[m]}
                    </span>
                    <span className="text-[10px] text-amber-300/90 font-mono mt-1">
                      {m === "KingOfHearts"
                        ? "+150 (x2=300)"
                        : m === "Diamonds"
                        ? "+10/♦ (x2=20)"
                        : m === "Queens"
                        ? "+20/Q (x2=40)"
                        : "+510 (x2=1020)"}
                    </span>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <div className="py-6 px-4">
              <div className="text-4xl mb-3 animate-bounce">👑</div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {selectorName} is selecting a mode...
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                The cards are dealt. Play will begin as soon as the mode is picked.
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        /* ========================================================= */
        /* STATE 2: ACTIVE TRICK CENTER CARDS                        */
        /* ========================================================= */
        <>
          {/* Subtle table felt watermark ring */}
          <div className="absolute inset-2 rounded-full border-2 border-emerald-400/10 flex items-center justify-center pointer-events-none">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-emerald-300/15 flex items-center justify-center bg-emerald-950/20 backdrop-blur-[2px]">
              {mode === "FiftyOne" && fiftyTotal !== undefined ? (
                /* FiftyOne: delegate entirely to FiftyOneCenter */
                null
              ) : (
                <span className="text-emerald-400/25 font-serif text-3xl font-black tracking-widest">
                  TRIX
                </span>
              )}
            </div>
          </div>

          {/* FiftyOne mode — replace card trick with FiftyOneCenter */}
          {mode === "FiftyOne" && fiftyTotal !== undefined && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <FiftyOneCenter
                total={fiftyTotal}
                direction={fiftyDirection ?? 1}
                recentPlays={(fiftyMoves ?? []).slice(-4).map((m) => ({
                  seat: m.seat,
                  card: m.card,
                  delta: m.delta,
                  aceValue: m.aceValue,
                }))}
                moveLog={fiftyMoves ?? []}
                names={names ?? ["Seat 1", "Seat 2", "Seat 3", "Seat 4"]}
                youSeat={youSeat}
                thinkingSeats={thinkingSeats ?? []}
                selectorSeat={selectorSeat ?? null}
                turnOrder={turnOrder ?? [0, 1, 2, 3]}
              />
            </div>
          )}

          {/* Winner banner: "Noah wins the trick" — not shown in FiftyOne mode */}
          <AnimatePresence>
            {winnerName && plays.length === 4 && mode !== "FiftyOne" && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="absolute -top-10 sm:-top-12 z-50 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(251,191,36,0.9)] tracking-wide border-2 border-yellow-100 flex items-center gap-1.5"
              >
                <span>🏆</span>
                <span>{winnerName} wins the trick!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Played Cards in Cross Form — not shown in FiftyOne mode (FiftyOneCenter handles its own layout) */}
          <AnimatePresence>
            {mode !== "FiftyOne" && plays.map((play) => {
              const relPos = getRelativePosition(play.seat);
              const target = positionOffsets[relPos];
              const isWinner = winnerSeat === play.seat;

              return (
                <motion.div
                  key={`${play.seat}-${play.card.rank}${play.card.suit}`}
                  initial={{
                    x: target.startX,
                    y: target.startY,
                    rotate: target.rotate * 3,
                    scale: 0.7,
                    opacity: 0,
                  }}
                  animate={
                    isCollecting
                      ? {
                          x: winnerExitTarget.startX * 1.2,
                          y: winnerExitTarget.startY * 1.2,
                          scale: 0.1,
                          opacity: 0,
                          transition: { duration: 0.65, ease: "easeInOut" },
                        }
                      : {
                          x: target.x,
                          y: target.y,
                          rotate: target.rotate,
                          scale: isWinner ? 1.22 : 1.05,
                          opacity: 1,
                          transition: {
                            type: "spring",
                            stiffness: 280,
                            damping: 24,
                          },
                        }
                  }
                  exit={{ opacity: 0, scale: 0.2 }}
                  style={{
                    position: "absolute",
                    zIndex: isWinner ? 35 : 20,
                  }}
                  className="drop-shadow-2xl"
                >
                  <PlayingCard
                    card={play.card}
                    size="lg"
                    isWinning={isWinner}
                    className={
                      isWinner
                        ? "ring-4 ring-yellow-400 border-yellow-300 shadow-[0_0_40px_rgba(250,204,21,1)]"
                        : "shadow-2xl"
                    }
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
