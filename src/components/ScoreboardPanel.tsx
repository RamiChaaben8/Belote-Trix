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
  const sorted = [...seats].sort((a, b) => a.total - b.total);

  return (
    <div
      className="fixed top-20 left-3 z-40 flex flex-col gap-1.5 p-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-amber-500/30 shadow-2xl text-xs select-none"
      style={{ width: "clamp(180px, 18vw, 260px)" }}
      data-testid="scoreboard-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800">
        <span className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-wider">
          🏆 Lowest Wins
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          R{roundNumber}/{totalRounds}
        </span>
      </div>

      {/* Mode & Selector */}
      <div className="flex flex-col gap-0.5 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Mode</span>
          <span className="font-bold text-amber-300 truncate max-w-[130px] text-right">
            {MODE_LABEL[mode] || mode || "Selecting…"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Selector</span>
          <span className="font-bold text-purple-300 truncate max-w-[130px] text-right">
            {selectorName || "—"} <span className="text-purple-400/70">(×2)</span>
          </span>
        </div>
      </div>

      {/* Ranking */}
      <div className="pt-1 border-t border-slate-800 space-y-0.5" data-testid="scoreboard">
        {sorted.map((item, idx) => (
          <div
            key={item.seat}
            className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[11px] ${
              idx === 0
                ? "bg-amber-950/40 text-amber-200 font-bold border border-amber-500/25"
                : "text-slate-300"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <span className="font-mono text-[10px] text-slate-500 shrink-0">
                #{idx + 1}
              </span>
              <span className="shrink-0">{item.avatar}</span>
              <span className="truncate">
                {item.name}{item.isYou ? " (You)" : ""}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-100 shrink-0 ml-2">
              {item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
