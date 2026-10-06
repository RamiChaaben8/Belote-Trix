"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { RoomView } from "@/hooks/useRoom";

type Act = (event: string, payload?: unknown) => Promise<unknown>;

export function RoomLobby({ room, act }: { room: RoomView; act: Act }) {
  const full = room.seats.every(Boolean);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/room/${room.code}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="mx-auto max-w-xl">
      <CardTitle>Lobby</CardTitle>
      
      {/* Invite Code & Wi-Fi Sharing */}
      <div className="mb-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-slate-300">
            Invite code:{" "}
            <span
              className="rounded bg-slate-800 px-2.5 py-1 font-mono text-xl tracking-widest text-emerald-400 font-black shadow-inner"
              data-testid="invite-code"
            >
              {room.code}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="text-xs h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            {copied ? "✓ Link Copied!" : "📋 Copy Room Link"}
          </Button>
        </div>

        {/* Local Wi-Fi banner */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
          <span className="text-base">📶</span>
          <div className="leading-tight">
            <span className="font-semibold">Play with devices on the same Wi-Fi:</span>
            <span className="text-slate-300 block sm:inline sm:ml-1">
              Have other devices visit{" "}
              <b className="font-mono text-emerald-300">http://192.168.1.155:3000</b> and enter code{" "}
              <b className="font-mono text-emerald-300">{room.code}</b>
            </span>
          </div>
        </div>
      </div>
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
          {/* Game Type: Full Match vs Quick Test */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Game Type:</span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="lobbyGameType"
                    value="full"
                    checked={room.gameType === "full"}
                    onChange={() => void act("set_game_type", { gameType: "full" })}
                    className="accent-amber-400"
                  />
                  <span>Full Match</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 font-bold">
                  <input
                    type="radio"
                    name="lobbyGameType"
                    value="quick"
                    checked={room.gameType === "quick"}
                    onChange={() => void act("set_game_type", { gameType: "quick" })}
                    className="accent-amber-400"
                  />
                  <span>Quick Test (1 Rnd)</span>
                </label>
              </div>
            </div>

            {room.gameType === "quick" && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-amber-300 font-semibold">Test Mode:</span>
                <select
                  value={room.quickMode}
                  onChange={(e) => void act("set_quick_mode", { quickMode: e.target.value })}
                  className="bg-slate-950 text-slate-100 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="KingOfHearts">King of Hearts</option>
                  <option value="Diamonds">Diamonds</option>
                  <option value="Queens">Queens</option>
                  <option value="Turns">Turns</option>
                  <option value="LastTrick">Last Trick</option>
                  <option value="Trix">Trix</option>
                  <option value="General">General</option>
                  <option value="Switch">Switch</option>
                  <option value="Star">⭐ Star</option>
                  <option value="FiftyOne">Fifty One</option>
                </select>
              </div>
            )}
          </div>

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
              {room.gameType === "quick" ? "Start Quick Test" : "Start game"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm text-slate-400">
          <p>
            Game Type:{" "}
            <b className={room.gameType === "quick" ? "text-amber-300" : "text-white"}>
              {room.gameType === "quick" ? `Quick Test (${room.quickMode})` : "Full Match"}
            </b>
          </p>
          <p>Waiting for the host to start the game…</p>
        </div>
      )}
    </Card>
  );
}
