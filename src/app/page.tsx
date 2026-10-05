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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(loadIdentity().name);
  }, []);

  const guestName = session?.user?.name ?? name;

  async function create(withBots: boolean) {
    setBusy(true);
    saveIdentity({ name: guestName });
    const res = await emitAck("create_room", { difficulty });
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
          Four players, four modes each. King of Hearts, Diamonds, Queens and Fifty One — play with friends, bots, or both.
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
      {error && <p className="text-red-400 md:col-span-2">{error}</p>}
    </div>
  );
}
