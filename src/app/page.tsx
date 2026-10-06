"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Input } from "@/components/ui/card";
import { loadIdentity, saveIdentity } from "@/lib/identity";
import { emitAck } from "@/socket/client";

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [gameType, setGameType] = useState<"full" | "quick">("full");
  const [quickMode, setQuickMode] = useState<"KingOfHearts" | "Diamonds" | "Queens" | "Turns" | "LastTrick" | "Trix" | "FiftyOne">("KingOfHearts");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(loadIdentity().name);
  }, []);

  const guestName = session?.user?.name ?? name;

  async function create(withBots: boolean) {
    setBusy(true);
    saveIdentity({ name: guestName });
    const res = await emitAck("create_room", { difficulty, gameType, quickMode });
    if (!res.ok || !res.code) {
      setError(res.error ?? "Could not create room");
      setBusy(false);
      return;
    }
    if (withBots) await emitAck("fill_bots");
    router.push(`/room/${res.code}`);
  }

  function join() {
    if (code.trim().length < 4) return setError("Enter an invite code");
    saveIdentity({ name: guestName });
    router.push(`/room/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <h1 className="text-4xl font-extrabold text-white">Belote Trix</h1>
        <p className="mt-2 text-slate-300">
          Four players, seven modes each. King of Hearts, Diamonds, Queens, Turns, Last Trick, Trix and Fifty One — play with friends, bots, or both.
        </p>
      </div>
      <Card className="md:col-span-2">
        <CardTitle>Your name</CardTitle>
        {session?.user ? (
          <p className="text-slate-200">Signed in as {session.user.name}</p>
        ) : (
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} aria-label="Display name" />
        )}
      </Card>
      <Card>
        <CardTitle>Create a game</CardTitle>

        {/* Game Type option: Full Match vs Quick Test */}
        <div className="mb-3.5 space-y-1.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Type:</span>
          <div className="flex gap-4 text-xs font-semibold">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-white">
              <input
                type="radio"
                name="gameType"
                value="full"
                checked={gameType === "full"}
                onChange={() => setGameType("full")}
                className="accent-amber-400"
              />
              <span>Full Match</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 hover:text-amber-200">
              <input
                type="radio"
                name="gameType"
                value="quick"
                checked={gameType === "quick"}
                onChange={() => setGameType("quick")}
                className="accent-amber-400"
              />
              <span className="flex items-center gap-1">
                <span>Quick Test</span>
                <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">1 Rnd</span>
              </span>
            </label>
          </div>

          {gameType === "quick" && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-xs text-amber-300/90 font-medium">Mode:</span>
              <select
                value={quickMode}
                onChange={(e) => setQuickMode(e.target.value as any)}
                className="bg-slate-950 text-slate-100 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="KingOfHearts">King of Hearts</option>
                <option value="Diamonds">Diamonds</option>
                <option value="Queens">Queens</option>
                <option value="Turns">Turns</option>
                <option value="LastTrick">Last Trick</option>
                <option value="Trix">Trix</option>
                <option value="FiftyOne">Fifty One</option>
              </select>
            </div>
          )}
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-slate-300">Bots:</span>
          {(["easy", "medium", "hard"] as const).map((d) => (
            <Button key={d} size="sm" variant={difficulty === d ? "default" : "outline"} onClick={() => setDifficulty(d)}>
              {d}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => create(true)} disabled={busy} data-testid="play-bots">
            Play vs bots
          </Button>
          <Button variant="secondary" onClick={() => create(false)} disabled={busy} data-testid="create-room">
            Create private room
          </Button>
        </div>
      </Card>
      <Card>
        <CardTitle>Join with invite code</CardTitle>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC123" maxLength={10} className="mb-3 uppercase" aria-label="Invite code" />
        <Button onClick={join} data-testid="join-room">
          Join room
        </Button>
      </Card>

      {/* Wi-Fi multiplayer card */}
      <Card className="md:col-span-2 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950 border-emerald-500/30">
        <div className="flex items-start gap-3">
          <div className="text-2xl p-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
            📶
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-300 text-sm">Play with Other Devices on the Same Wi-Fi</h3>
            <p className="text-xs text-slate-300">
              Your server is listening on your local network! From phones, tablets, or other laptops connected to this Wi-Fi, open:
            </p>
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold bg-slate-950 px-3 py-1 rounded-lg border border-emerald-500/40 text-emerald-400 select-all">
                http://192.168.1.155:3000
              </span>
              <span className="text-xs text-slate-400">
                Create a room on one device, then join using the invite code on the other devices!
              </span>
            </div>
          </div>
        </div>
      </Card>

      {error && <p className="text-red-400 md:col-span-2">{error}</p>}
    </div>
  );
}
