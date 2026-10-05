"use client";

import { useEffect, useMemo, useState } from "react";
import { PlayingCard } from "@/components/PlayingCard";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { MODE_LABEL } from "@/lib/utils";
import type { CardData } from "@/types";
import { useParams } from "next/navigation";

interface GameData {
  players: { seat: number; name: string; avatar: string; totalScore: number }[];
  rounds: {
    id: string;
    number: number;
    mode: string;
    selectorSeat: number;
    hands: CardData[][];
    scores: number[];
    playedCards: { seq: number; seat: number; suit: CardData["suit"]; rank: CardData["rank"]; trickId: string | null; meta: { total: number } | null }[];
  }[];
  chat: { author: string; content: string }[];
}

export default function ReplayPage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetch(`/api/games/${id}`)
      .then(async (r) => {
        if (!r.ok) return setError("Game not found");
        setGame(((await r.json()) as { game: GameData }).game);
      })
      .catch(() => setError("Unable to load replay"));
  }, [id]);

  const round = game?.rounds[roundIdx];
  const total = round?.playedCards.length ?? 0;

  useEffect(() => {
    if (!playing) return;
    if (step >= total) return setPlaying(false);
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [playing, step, total]);

  const state = useMemo(() => {
    if (!round) return null;
    const hands = round.hands.map((h) => [...h]);
    const played = round.playedCards.slice(0, step);
    for (const p of played) {
      const i = hands[p.seat].findIndex((c) => c.suit === p.suit && c.rank === p.rank);
      if (i >= 0) hands[p.seat].splice(i, 1);
    }
    const isFifty = round.mode === "FiftyOne";
    const current = isFifty ? played.slice(-1) : played.slice(Math.floor((played.length - 1) / 4) * 4).slice(0, 4);
    const fiftyTotal = isFifty ? (played[played.length - 1]?.meta?.total ?? 0) : null;
    return { hands, current: played.length ? current : [], fiftyTotal };
  }, [round, step]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!game || !round || !state) return <p className="text-slate-300">Loading replay…</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Replay</CardTitle>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={roundIdx}
            onChange={(e) => {
              setRoundIdx(Number(e.target.value));
              setStep(0);
              setPlaying(false);
            }}
            className="rounded bg-slate-800 px-2 py-1 text-sm"
            aria-label="Round"
          >
            {game.rounds.map((r, i) => (
              <option key={r.id} value={i}>
                Round {r.number} — {MODE_LABEL[r.mode]} ({game.players[r.selectorSeat]?.name})
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>◀</Button>
          <Button size="sm" onClick={() => { if (step >= total) setStep(0); setPlaying((p) => !p); }}>{playing ? "Pause" : "Play"}</Button>
          <Button size="sm" variant="secondary" onClick={() => setStep((s) => Math.min(total, s + 1))}>▶</Button>
          <span className="text-sm text-slate-400">{step}/{total}</span>
        </div>
        {state.fiftyTotal !== null && <p className="mb-2 text-2xl font-bold text-white">Total: {state.fiftyTotal}</p>}
        <div className="mb-4 flex min-h-28 flex-wrap items-center justify-center gap-3 rounded-2xl bg-felt p-4">
          {state.current.map((p) => (
            <div key={p.seq} className="text-center text-xs text-white">
              <PlayingCard card={{ suit: p.suit, rank: p.rank }} small />
              {game.players[p.seat]?.name}
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {state.hands.map((h, seat) => (
            <div key={seat}>
              <p className="mb-1 text-sm text-slate-300">{game.players[seat]?.avatar} {game.players[seat]?.name} — round score {round.scores[seat]}</p>
              <div className="flex flex-wrap gap-1">{h.map((c) => <PlayingCard key={c.rank + c.suit} card={c} small />)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
