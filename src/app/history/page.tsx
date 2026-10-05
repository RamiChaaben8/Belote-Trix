"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";

interface GameRow {
  id: string;
  code: string;
  startedAt: string;
  players: { seat: number; name: string; totalScore: number; winner: boolean; userId: string | null; isBot: boolean }[];
}

export default function HistoryPage() {
  const [games, setGames] = useState<GameRow[] | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then(async (r) => {
        if (r.status === 401) return setError("Sign in to see your match history.");
        const d = (await r.json()) as { games: GameRow[]; uid: string };
        setGames(d.games);
        setUid(d.uid);
      })
      .catch(() => setError("Unable to load history"));
  }, []);

  return (
    <Card>
      <CardTitle>Match history</CardTitle>
      {error && <p className="text-slate-300">{error} <Link href="/login" className="text-emerald-400">Sign in</Link></p>}
      <ul className="space-y-3">
        {games?.map((g) => {
          const me = g.players.find((p) => p.userId === uid);
          return (
            <li key={g.id} className="rounded-lg bg-slate-800 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-300">{new Date(g.startedAt).toLocaleString()} · room {g.code}</span>
                <span className={me?.winner ? "font-bold text-amber-300" : "text-slate-400"}>{me?.winner ? "Won" : "Lost"}</span>
                <Link href={`/replay/${g.id}`} className="text-emerald-400">Replay</Link>
              </div>
              <div className="mt-1 text-slate-200">{g.players.map((p) => `${p.name}: ${p.totalScore}`).join(" · ")}</div>
            </li>
          );
        })}
        {games?.length === 0 && <li className="text-slate-400">No games yet. Sign in and play one!</li>}
      </ul>
    </Card>
  );
}
