"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";

interface Row {
  id: string;
  name: string;
  avatar: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(async (r) => {
        const d = (await r.json()) as { users: Row[]; error?: string };
        setRows(d.users);
        if (d.error) setError(d.error);
      })
      .catch(() => setError("Unable to load leaderboard"));
  }, []);

  return (
    <Card>
      <CardTitle>Leaderboard</CardTitle>
      {error && <p className="text-red-400">{error}</p>}
      {rows && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="leaderboard-table">
            <thead className="text-slate-400">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Player</th>
                <th className="p-2">Games</th>
                <th className="p-2">Wins</th>
                <th className="p-2">Win rate</th>
                <th className="p-2">Total score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.id} className="border-t border-slate-800">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{u.avatar} {u.name}</td>
                  <td className="p-2">{u.gamesPlayed}</td>
                  <td className="p-2">{u.gamesWon}</td>
                  <td className="p-2">{u.gamesPlayed ? Math.round((u.gamesWon / u.gamesPlayed) * 100) : 0}%</td>
                  <td className="p-2">{u.totalScore}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">No players yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
