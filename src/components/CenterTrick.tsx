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

  // Switch multi-step wizard
  switchPhase?: "sub_select" | "target_select" | "reveal" | "playing" | null;
  completedModes?: string[];
  onSelectSwitchSubMode?: (mode: string) => void;
  switchSubMode?: string | null;
  onSelectSwitchTarget?: (seat: number) => void;
  seatNames?: string[];
  seatAvatars?: string[];
  youSeatForSwitch?: number;

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
  avatars?: string[];
  thinkingSeats?: number[];
  selectorSeat?: number | null;
  turnOrder?: number[];
  /** Per-seat trick counts for Turns mode (index = seat). */
  trickCounts?: number[];
}

export function CenterTrick({
  isSelectingMode,
  isCurrentUserSelector,
  selectorName,
  remainingModes,
  onSelectMode,
  switchPhase,
  completedModes = [],
  onSelectSwitchSubMode,
  switchSubMode,
  onSelectSwitchTarget,
  seatNames = [],
  seatAvatars = [],
  youSeatForSwitch,
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
  avatars,
  thinkingSeats,
  selectorSeat,
  turnOrder,
  trickCounts,
}: CenterTrickProps) {
  const getRelativePosition = (seat: number): "bottom" | "left" | "top" | "right" => {
    const rel = (seat - youSeat + 4) % 4;
    switch (rel) {
      case 0: return "bottom";
      case 1: return "left";
      case 2: return "top";
      case 3: return "right";
      default: return "bottom";
    }
  };

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

  const showSwitchSubPicker = switchPhase === "sub_select";
  const showSwitchTargetPicker = switchPhase === "target_select";
  const showSwitchWizard = showSwitchSubPicker || showSwitchTargetPicker;

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none pointer-events-none">

      {/* ============================================================ */}
      {/* SWITCH WIZARD — Steps 2 & 3                                  */}
      {/* ============================================================ */}
      {showSwitchWizard ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[25] bg-black/35 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-30 pointer-events-auto flex flex-col items-center justify-center p-5 sm:p-7 rounded-3xl bg-slate-950/98 border-2 border-cyan-400/60 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-sm sm:max-w-md text-center"
          >
            {/* Step 2: pick sub-mode */}
            {showSwitchSubPicker && (
              <>
                <div className="flex items-center gap-2 mb-1 text-cyan-300 font-black text-base sm:text-lg">
                  <span className="text-xl">🔄</span>
                  <span>Switch — Pick a Mode to Replay</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold mb-4">
                  {isCurrentUserSelector
                    ? "Choose which completed mode you want to replay with swapped hands!"
                    : `${selectorName} is choosing which mode to replay…`}
                </p>
                {isCurrentUserSelector ? (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {completedModes.map((m) => (
                      <motion.button
                        key={m}
                        whileHover={{ scale: 1.06, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onSelectSwitchSubMode?.(m)}
                        className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-cyan-900/90 hover:to-blue-900/90 border-2 border-slate-700 hover:border-cyan-400 text-white shadow-xl transition-all"
                      >
                        <span className="font-extrabold text-sm sm:text-base">{MODE_LABEL[m] ?? m}</span>
                        <span className="text-[10px] text-cyan-300/90 font-mono mt-1">✅ Completed</span>
                      </motion.button>
                    ))}
                    {completedModes.length === 0 && (
                      <div className="col-span-2 py-4 text-slate-500 text-sm italic">
                        No completed modes yet.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <div className="text-3xl mb-2 animate-spin">🔄</div>
                    <p className="text-slate-400 text-sm">Waiting for {selectorName}…</p>
                  </div>
                )}
              </>
            )}

            {/* Step 3: pick swap target */}
            {showSwitchTargetPicker && (
              <>
                <div className="flex items-center gap-2 mb-1 text-cyan-300 font-black text-base sm:text-lg">
                  <span className="text-xl">🔄</span>
                  <span>Switch — Pick Swap Partner</span>
                </div>
                {switchSubMode && (
                  <div className="mb-2 text-xs font-bold text-amber-300 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-400/40">
                    Replaying: {MODE_LABEL[switchSubMode] ?? switchSubMode}
                  </div>
                )}
                <p className="text-xs text-slate-400 font-semibold mb-4">
                  {isCurrentUserSelector
                    ? "Choose a player to swap hands with. The other two players also swap automatically."
                    : `${selectorName} is choosing who to swap hands with…`}
                </p>
                {isCurrentUserSelector ? (
                  <div className="flex flex-col gap-2.5 w-full">
                    {[0, 1, 2, 3]
                      .filter((s) => s !== youSeatForSwitch)
                      .map((s) => (
                        <motion.button
                          key={s}
                          whileHover={{ scale: 1.04, x: 4 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onSelectSwitchTarget?.(s)}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-cyan-900/90 hover:to-blue-900/90 border-2 border-slate-700 hover:border-cyan-400 text-white shadow-xl transition-all"
                        >
                          <span className="text-2xl">{seatAvatars[s] ?? "🙂"}</span>
                          <span className="font-bold text-base">{seatNames[s] ?? `Seat ${s + 1}`}</span>
                          <span className="ml-auto text-[10px] text-cyan-300/80 font-mono">Swap ↔</span>
                        </motion.button>
                      ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <div className="text-3xl mb-2 animate-spin">🔄</div>
                    <p className="text-slate-400 text-sm">Waiting for {selectorName}…</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      ) : isSelectingMode ? (
        /* ============================================================ */
        /* STATE 1: LARGE CENTER MODE SELECTION                         */
        /* ============================================================ */
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[25] bg-black/35 pointer-events-none"
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-30 pointer-events-auto flex flex-col items-center justify-center p-5 sm:p-7 rounded-3xl bg-slate-950/98 border-2 border-amber-400/60 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-sm sm:max-w-md text-center"
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
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 text-white shadow-xl transition-all ${
                        m === "Switch"
                          ? "bg-gradient-to-b from-cyan-900/80 to-slate-900 hover:from-cyan-800/90 hover:to-blue-900/90 border-cyan-500/60 hover:border-cyan-400"
                          : "bg-gradient-to-b from-slate-800 to-slate-900 hover:from-purple-900/90 hover:to-indigo-900/90 border-slate-700 hover:border-purple-400"
                      }`}
                    >
                      <span className="font-extrabold text-sm sm:text-base">
                        {m === "Switch" ? "🔄 " : ""}{MODE_LABEL[m]}
                      </span>
                      <span className="text-[10px] text-amber-300/90 font-mono mt-1">
                        {m === "KingOfHearts"
                          ? "+150 (x2=300)"
                          : m === "Diamonds"
                          ? "+10/♦ (x2=20)"
                          : m === "Queens"
                          ? "+20/Q (x2=40)"
                          : m === "Turns"
                          ? "+10 per trick won"
                          : m === "LastTrick"
                          ? "+100 for final trick"
                          : m === "Trix"
                          ? "1st: -100 · 2nd: -50"
                          : m === "Switch"
                          ? "All scores ×2 + swap hands!"
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
        </>
      ) : (
        /* ============================================================ */
        /* STATE 2: ACTIVE TRICK CENTER CARDS                           */
        /* ============================================================ */
        <>
          {mode !== "Trix" && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-emerald-400/5 flex items-center justify-center pointer-events-none z-0 opacity-5">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-emerald-300/10 flex items-center justify-center bg-emerald-950/10">
                {mode === "FiftyOne" && fiftyTotal !== undefined ? null : (
                  <span className="text-emerald-400/20 font-serif text-3xl font-black tracking-widest">
                    TRIX
                  </span>
                )}
              </div>
            </div>
          )}

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
                avatars={avatars ?? ["🙂", "🙂", "🙂", "🙂"]}
                youSeat={youSeat}
                thinkingSeats={thinkingSeats ?? []}
                selectorSeat={selectorSeat ?? null}
                turnOrder={turnOrder ?? [0, 1, 2, 3]}
              />
            </div>
          )}

          <AnimatePresence>
            {winnerName && plays.length === 4 && mode !== "FiftyOne" && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="absolute top-2 sm:top-3 z-50 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(251,191,36,0.9)] tracking-wide border-2 border-yellow-100 flex items-center gap-1.5"
              >
                <span>🏆</span>
                <span>{winnerName} wins the trick</span>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "Turns" && trickCounts && names && (
            <motion.div
              initial={{ opacity: 0, x: 40, y: "-50%" }}
              animate={{ opacity: 1, x: 0, y: "-50%" }}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1 px-2.5 py-2 rounded-xl bg-slate-950/95 border border-teal-500/40 shadow-xl text-[11px] min-w-[110px]"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-0.5 text-center">
                Tricks Won
              </div>
              {[0, 1, 2, 3].map((seat) => (
                <div
                  key={seat}
                  className={`flex items-center justify-between gap-2 px-1.5 py-0.5 rounded ${
                    seat === youSeat ? "bg-teal-950/60 text-teal-200 font-bold" : "text-slate-300"
                  }`}
                >
                  <span className="truncate max-w-[70px]">
                    {names[seat] ?? `Seat ${seat + 1}`}
                  </span>
                  <span className="font-mono font-bold text-amber-300 shrink-0">
                    {trickCounts[seat] ?? 0}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          <AnimatePresence>
            {mode !== "FiftyOne" &&
              plays.map((play) => {
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
                      scale: 0.6,
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
                              stiffness: 180,
                              damping: 20,
                              mass: 0.9,
                              duration: 0.65,
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
