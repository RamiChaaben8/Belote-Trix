"use client";

import { MODE_LABEL, MODE_HELP } from "@/lib/utils";

interface GameInfoPanelProps {
  mode: string;
  selectorName: string;
  roundNumber: number;
  totalRounds: number;
  trickNumber: number;
  leaderName: string;
  turnName: string;
  heartsBroken: boolean;
  diamondsBroken: boolean;
}

export function GameInfoPanel({
  mode,
  selectorName,
  roundNumber,
  totalRounds,
  trickNumber,
  leaderName,
  turnName,
  heartsBroken,
  diamondsBroken,
}: GameInfoPanelProps) {
  const modeTitle = MODE_LABEL[mode] || mode || "Selecting Mode";
  const modeHelp = MODE_HELP[mode] || "";

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/70 shadow-xl text-xs sm:text-sm text-slate-200">
      {/* Lowest score banner */}
      <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold text-xs">
        <span>⭐ Rule</span>
        <span className="text-[11px] font-bold">Winner is the player with the LOWEST score</span>
      </div>

      {/* Mode Header */}
      <div className="border-b border-slate-700/60 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Current Mode</span>
          <span
            data-testid="current-mode"
            className="font-bold text-amber-300 text-sm sm:text-base px-2 py-0.5 rounded bg-slate-800 border border-slate-700 shadow-sm"
          >
            {modeTitle}
          </span>
        </div>
        {modeHelp && (
          <p className="text-[11px] text-slate-400 mt-1 italic">{modeHelp}</p>
        )}
      </div>

      {/* Grid of Round Info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col p-1.5 rounded bg-slate-800/60">
          <span className="text-slate-400 text-[10px] uppercase font-bold">Round</span>
          <span className="font-semibold text-white">
            {roundNumber} / {totalRounds}
          </span>
        </div>

        <div className="flex flex-col p-1.5 rounded bg-slate-800/60">
          <span className="text-slate-400 text-[10px] uppercase font-bold">Trick</span>
          <span className="font-semibold text-white">
            {mode === "FiftyOne" ? "N/A" : `${Math.min(trickNumber, 8)} / 8`}
          </span>
        </div>

        <div className="flex flex-col p-1.5 rounded bg-slate-800/60">
          <span className="text-slate-400 text-[10px] uppercase font-bold">Selector (x2)</span>
          <span data-testid="current-selector" className="font-semibold text-purple-300 truncate">
            {selectorName || "—"}
          </span>
        </div>

        <div className="flex flex-col p-1.5 rounded bg-slate-800/60">
          <span className="text-slate-400 text-[10px] uppercase font-bold">Trick Leader</span>
          <span className="font-semibold text-blue-300 truncate">
            {leaderName || "—"}
          </span>
        </div>
      </div>

      {/* Current Turn & Broken Suits */}
      <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-xs">Current Turn:</span>
          <span className="font-bold text-amber-400 text-xs sm:text-sm animate-pulse">
            {turnName || "—"}
          </span>
        </div>

        {/* Broken suits indicators */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span
            className={`px-1.5 py-0.5 rounded border ${
              heartsBroken
                ? "bg-rose-950/80 border-rose-500/50 text-rose-300 font-bold"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title={heartsBroken ? "Hearts Broken (legal to lead)" : "Hearts Not Broken"}
          >
            ♥ {heartsBroken ? "Broken" : "Locked"}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border ${
              diamondsBroken
                ? "bg-amber-950/80 border-amber-500/50 text-amber-300 font-bold"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title={diamondsBroken ? "Diamonds Broken (legal to lead)" : "Diamonds Not Broken"}
          >
            ♦ {diamondsBroken ? "Broken" : "Locked"}
          </span>
        </div>
      </div>
    </div>
  );
}
