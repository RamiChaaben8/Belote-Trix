"use client";

import { useState } from "react";
import { PlayingCard } from "@/components/PlayingCard";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { LastTrick, RoomView } from "@/hooks/useRoom";
import { cn, MODE_HELP, MODE_LABEL } from "@/lib/utils";
import type { CardData, Move } from "@/types";

type Act = (event: string, payload?: unknown) => Promise<unknown>;

const POS = ["bottom", "left", "top", "right"] as const;

export function Table({ room, lastTrick, act, gameId }: { room: RoomView; lastTrick: LastTrick | null; act: Act; gameId: string | null }) {
  const me = room.you ?? 0;
  const rel = (seat: number) => (seat - me + 4) % 4;
  const [aceFor, setAceFor] = useState<CardData | null>(null);
  const round = room.round;
  const myTurn = room.you !== null && room.actor === room.you;
  const isSelector = room.phase === "selecting" && room.selector === room.you;
  const trickToShow = lastTrick && (!round || round.trick.length === 0) ? lastTrick.plays : (round?.trick ?? []);
  const name = (s: number) => room.seats[s]?.name ?? `Seat ${s + 1}`;

  const legalFor = (c: CardData): Move[] => room.legal.filter((m) => m.card.suit === c.suit && m.card.rank === c.rank);
  const clickCard = (c: CardData) => {
    const moves = legalFor(c);
    if (!moves.length || !myTurn) return;
    if (moves.length > 1) setAceFor(c);
    else {
      setAceFor(null);
      void act("play_card", moves[0]);
    }
  };

  const modeLabel = round ? MODE_LABEL[round.mode] : room.phase === "selecting" && room.selector !== null ? "Choosing mode…" : "—";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200" data-testid="status-bar">
          <span className="rounded bg-slate-800 px-2 py-1">
            Round {Math.min(room.roundNumber + (room.phase === "selecting" ? 1 : 0), room.totalRounds)}/{room.totalRounds}
          </span>
          <span className="rounded bg-emerald-800 px-2 py-1 font-semibold" data-testid="current-mode">
            Mode: {modeLabel}
          </span>
          {room.selector !== null && room.phase !== "finished" && (
            <span className="rounded bg-slate-800 px-2 py-1" data-testid="current-selector">
              Selector: {name(room.selector)}
            </span>
          )}
          {round && !round.broken && (round.mode === "KingOfHearts" || round.mode === "Diamonds") && (
            <span className="rounded bg-amber-700 px-2 py-1">{round.mode === "KingOfHearts" ? "♥" : "♦"} not broken</span>
          )}
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full max-w-3xl rounded-[3rem] border-8 border-amber-900 bg-gradient-to-b from-felt-light to-felt-dark shadow-2xl sm:aspect-[16/10]">
          {room.seats.map((s, seat) => {
            const pos = POS[rel(seat)];
            if (!s) return null;
            const active = room.actor === seat && room.phase !== "finished";
            return (
              <div
                key={seat}
                data-testid={`seat-${seat}`}
                className={cn(
                  "absolute flex flex-col items-center gap-1 text-center",
                  pos === "bottom" && "bottom-1 left-1/2 -translate-x-1/2",
                  pos === "top" && "left-1/2 top-1 -translate-x-1/2",
                  pos === "left" && "left-1 top-1/2 -translate-y-1/2",
                  pos === "right" && "right-1 top-1/2 -translate-y-1/2",
                )}
              >
                <div className={cn("flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white", active && "ring-2 ring-amber-400 animate-pulse")}>
                  <span className="text-lg">{s.avatar}</span>
                  <span className="max-w-[90px] truncate font-semibold">{s.name}</span>
                  {!s.connected && <span title="disconnected">⚠️</span>}
                  <span className="rounded bg-emerald-700 px-1">{room.totals[seat]}</span>
                </div>
                {pos !== "bottom" && room.phase !== "finished" && (
                  <div className="flex -space-x-8">
                    {Array.from({ length: Math.min(room.handCounts[seat], 8) }).map((_, i) => (
                      <PlayingCard key={i} hidden small />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2">
            {round?.mode === "FiftyOne" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center" data-testid="fifty-total">
                <div className="text-5xl font-extrabold text-white drop-shadow">{round.total}</div>
                <div className="text-xs text-emerald-100">/ 51 · {round.direction === 1 ? "↻ clockwise" : "↺ counter-clockwise"}</div>
              </div>
            ) : null}
            {trickToShow.map((p) => {
              const pos = POS[rel(p.seat)];
              return (
                <div
                  key={p.seat}
                  className={cn(
                    "absolute transition-all duration-300",
                    pos === "bottom" && "bottom-0 left-1/2 -translate-x-1/2",
                    pos === "top" && "left-1/2 top-0 -translate-x-1/2",
                    pos === "left" && "left-0 top-1/2 -translate-y-1/2",
                    pos === "right" && "right-0 top-1/2 -translate-y-1/2",
                    lastTrick && lastTrick.winner === p.seat && "scale-110",
                  )}
                >
                  <PlayingCard card={p.card} small highlight={!!lastTrick && lastTrick.winner === p.seat} />
                </div>
              );
            })}
            {round?.mode === "FiftyOne" && round.trick.length === 0 && trickToShow.length === 0 && null}
          </div>
        </div>

        {room.phase === "finished" ? (
          <Card className="text-center">
            <CardTitle>Game over</CardTitle>
            <ul className="mb-3 space-y-1">
              {room.totals
                .map((t, seat) => ({ t, seat }))
                .sort((a, b) => b.t - a.t)
                .map(({ t, seat }, i) => (
                  <li key={seat} className={cn("text-slate-200", i === 0 && "font-bold text-amber-300")}>
                    {i === 0 ? "🏆 " : ""}
                    {name(seat)} — {t}
                  </li>
                ))}
            </ul>
            {gameId && (
              <a className="text-emerald-400 underline" href={`/replay/${gameId}`}>
                Watch replay
              </a>
            )}
          </Card>
        ) : isSelector ? (
          <Card>
            <CardTitle>Choose your mode</CardTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              {room.remaining.map((m) => (
                <Button key={m} variant="secondary" data-testid={`mode-${m}`} onClick={() => void act("select_mode", { mode: m })}>
                  <span className="text-left">
                    <span className="block">{MODE_LABEL[m]}</span>
                    <span className="block text-xs font-normal text-slate-300">{MODE_HELP[m]}</span>
                  </span>
                </Button>
              ))}
            </div>
          </Card>
        ) : null}

        {aceFor && myTurn && (
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-slate-200">Ace counts as:</span>
            {legalFor(aceFor).map((m) => (
              <Button
                key={m.aceValue}
                data-testid={`ace-${m.aceValue}`}
                onClick={() => {
                  setAceFor(null);
                  void act("play_card", m);
                }}
              >
                +{m.aceValue}
              </Button>
            ))}
          </div>
        )}

        {room.you !== null && room.phase !== "finished" && (
          <div>
            <p className="mb-1 text-center text-sm text-slate-300" data-testid="turn-hint">
              {myTurn ? (room.phase === "selecting" ? "Your pick" : "Your turn") : room.actor !== null ? `Waiting for ${name(room.actor)}…` : ""}
            </p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2" data-testid="hand">
              {room.hand.map((c) => {
                const playable = myTurn && legalFor(c).length > 0;
                return <PlayingCard key={c.rank + c.suit} card={c} onClick={playable ? () => clickCard(c) : undefined} disabled={!playable} />;
              })}
            </div>
            {room.phase === "playing" && myTurn && room.legal.length === 0 && <p className="text-center text-xs text-amber-300">No legal move, you will be skipped.</p>}
          </div>
        )}
        {room.you === null && <p className="text-center text-sm text-slate-400">You are spectating.</p>}
      </div>

      <div className="space-y-4">
        <Card>
          <CardTitle>Scores</CardTitle>
          <ul className="space-y-1 text-sm" data-testid="scoreboard">
            {room.seats.map((s, seat) => (
              <li key={seat} className="flex justify-between text-slate-200">
                <span>
                  {s?.avatar} {s?.name}
                </span>
                <span className="font-mono">
                  {room.totals[seat]}
                  {round && round.scores[seat] !== 0 && <span className="text-emerald-400"> (+{round.scores[seat]})</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Modes played</CardTitle>
          <ul className="space-y-1 text-xs text-slate-300">
            {room.seats.map((s, seat) => (
              <li key={seat}>
                <span className="font-semibold">{s?.name}:</span> {room.used[seat].map((m) => MODE_LABEL[m]).join(", ") || "—"}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="max-h-64 overflow-y-auto">
          <CardTitle>Trick history</CardTitle>
          {round && round.mode !== "FiftyOne" ? (
            <ol className="space-y-1 text-xs text-slate-300">
              {round.tricks.map((t) => (
                <li key={t.index}>
                  #{t.index + 1}: {t.plays.map((p) => `${p.card.rank}${p.card.suit}`).join(" ")} → <b>{name(t.winner)}</b>
                  {t.points ? ` (+${t.points})` : ""}
                </li>
              ))}
              {round.tricks.length === 0 && <li>No tricks yet.</li>}
            </ol>
          ) : (
            <p className="text-xs text-slate-400">Tricks are not captured in this mode.</p>
          )}
          {room.history.length > 0 && (
            <>
              <h3 className="mb-1 mt-3 text-sm font-bold text-white">Past rounds</h3>
              <ul className="space-y-1 text-xs text-slate-300">
                {room.history.map((h) => (
                  <li key={h.number}>
                    R{h.number} {MODE_LABEL[h.mode]} ({name(h.selector)}): {h.scores.join(" / ")}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
