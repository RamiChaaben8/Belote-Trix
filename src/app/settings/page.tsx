"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Input } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { loadIdentity, saveIdentity } from "@/lib/identity";

const AVATARS = ["🙂", "🦊", "🐻", "🐼", "🦁", "🐯", "🐸", "🐙", "🦉", "🐧"];

export default function SettingsPage() {
  const { sound, setSound } = useSettings();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🙂");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const id = loadIdentity();
    setName(id.name);
    setAvatar(id.avatar);
  }, []);

  async function save() {
    saveIdentity({ name, avatar });
    if (session?.user) {
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, avatar, soundOn: sound }) });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardTitle>Settings</CardTitle>
      <div className="space-y-4">
        <label className="block text-sm text-slate-300">
          Display name
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} className="mt-1" />
        </label>
        <div>
          <p className="mb-1 text-sm text-slate-300">Avatar</p>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatar(a)} className={`rounded-lg px-2 py-1 text-2xl ${avatar === a ? "bg-emerald-700" : "bg-slate-800"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
          Sound effects
        </label>
        <Button onClick={save}>{saved ? "Saved ✓" : "Save"}</Button>
        <p className="text-xs text-slate-500">Name and avatar apply the next time you join a room.</p>
      </div>
    </Card>
  );
}
