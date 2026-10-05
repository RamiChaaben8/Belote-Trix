"use client";

import { MODE_LABEL } from "@/lib/utils";

interface ScoreboardPanelProps {
  roundNumber: number;
  totalRounds: number;
  mode: string;
  selectorName: string;
  seats: {
    seat: number;
    name: string;
    avatar: string;
    total: number;
    isYou: boolean;
  }[];
}

export function ScoreboardPanel({
  roundNumber,
  totalRounds,
  mode,
  selectorName,
  seats,
}: ScoreboardPanelProps) {
  // Sort ascending by total score (lowest score first = #1)
  const sorted = [...seats].sort((a, b) => a.total - b.total);

  return (
    <div className="flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 shadow-xl max-w-[210px] sm:max-w-[250px] text-xs select-none">
      {/* Permanent Lowest Score Wins Header */}
      <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800">
        <span className="font-extrabold text-[10px] sm:text-[11px] text-emerald-400 uppercase tracking-wider">
          🏆 Lowest Score Wins
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          R{roundNumber}/{totalRounds}
        </span>
      </div>

      {/* Mode & Selector Info */}
      <div className="flex flex-col text-[11px] text-slate-300">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Mode:</span>
          <span className="font-bold text-amber-300 truncate max-w-[120px]">
            {MODE_LABEL[mode] || mode || "Selecting"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Selector:</span>
          <span className="font-bold text-purple-300 truncate max-w-[120px]">
            {selectorName || "—"} (x2)
          </span>
        </div>
      </div>

      {/* Current Ranking (Lowest score #1) */}
      <div className="mt-0.5 pt-1 border-t border-slate-800 space-y-1" data-testid="scoreboard">
        {sorted.map((item, idx) => (
          <div
            key={item.seat}
            className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[11px] ${
              idx === 0
                ? "bg-amber-950/40 text-amber-200 font-bold border border-amber-500/30"
                : "text-slate-300"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-mono text-[10px] text-slate-400 w-3.5">
                #{idx + 1}
              </span>
              <span>{item.avatar}</span>
              <span className="truncate max-w-[80px] sm:max-w-[100px]">
                {item.name} {item.isYou ? "(You)" : ""}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-100">
              {item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
