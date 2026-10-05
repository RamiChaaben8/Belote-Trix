"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { RoomView } from "@/hooks/useRoom";

type Act = (event: string, payload?: unknown) => Promise<unknown>;

export function RoomLobby({ room, act }: { room: RoomView; act: Act }) {
  const full = room.seats.every(Boolean);
  return (
    <Card className="mx-auto max-w-xl">
      <CardTitle>Lobby</CardTitle>
      <p className="mb-3 text-sm text-slate-300">
        Invite code: <span className="rounded bg-slate-800 px-2 py-1 font-mono text-lg tracking-widest text-emerald-400" data-testid="invite-code">{room.code}</span>
      </p>
      <ul className="mb-4 space-y-2">
        {room.seats.map((s, i) => (
          <li key={i} className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100" data-testid={`lobby-seat-${i}`}>
            <span>
              {s ? `${s.avatar} ${s.name}${s.isHost ? " (host)" : ""}${s.isBot ? " — bot" : ""}` : <span className="text-slate-500">Empty seat</span>}
            </span>
            {room.isHost && s?.isBot && (
              <Button size="sm" variant="ghost" onClick={() => void act("remove_bot", { seat: i })}>
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
      {room.isHost ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            Bot difficulty:
            {(["easy", "medium", "hard"] as const).map((d) => (
              <Button key={d} size="sm" variant={room.difficulty === d ? "default" : "outline"} onClick={() => void act("set_difficulty", { difficulty: d })}>
                {d}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void act("add_bot")} disabled={full}>
              Add bot
            </Button>
            <Button variant="secondary" onClick={() => void act("fill_bots")} disabled={full} data-testid="fill-bots">
              Fill with bots
            </Button>
            <Button onClick={() => void act("start_game")} disabled={!full} data-testid="start-game">
              Start game
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Waiting for the host to start the game…</p>
      )}
    </Card>
  );
}
