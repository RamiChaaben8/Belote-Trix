"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { MODE_LABEL } from "@/lib/utils";

interface Profile {
  user: { name: string; email: string; avatar: string; gamesPlayed: number; gamesWon: number; totalScore: number; createdAt: string };
  modes: { mode: string; _count: { mode: number } }[];
}

export default function ProfilePage() {
  const [data, setData] = useState<Profile | null>(null);
  const [anon, setAnon] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(async (r) => {
      if (r.status === 401) return setAnon(true);
      setData((await r.json()) as Profile);
    });
  }, []);

  if (anon)
    return (
      <Card>
        <p className="text-slate-300">Sign in to see your profile and statistics. <Link href="/login" className="text-emerald-400">Sign in</Link></p>
      </Card>
    );
  if (!data) return <p className="text-slate-300">Loading…</p>;
  const { user } = data;
  const rate = user.gamesPlayed ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;
  const stat = (label: string, value: string | number) => (
    <div className="rounded-lg bg-slate-800 p-3 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
  return (
    <Card>
      <CardTitle>
        <span className="mr-2 text-3xl">{user.avatar}</span>
        {user.name}
      </CardTitle>
      <p className="mb-4 text-sm text-slate-400">{user.email} · member since {new Date(user.createdAt).toLocaleDateString()}</p>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat("Games", user.gamesPlayed)}
        {stat("Wins", user.gamesWon)}
        {stat("Win rate", `${rate}%`)}
        {stat("Total score", user.totalScore)}
      </div>
      <h3 className="mb-2 font-semibold text-white">Modes played</h3>
      <ul className="text-sm text-slate-300">
        {data.modes.map((m) => (
          <li key={m.mode}>{MODE_LABEL[m.mode]}: {m._count.mode}</li>
        ))}
        {data.modes.length === 0 && <li>No finished games yet.</li>}
      </ul>
    </Card>
  );
}
