"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Input } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      setError(((await res.json()) as { error?: string }).error ?? "Registration failed");
      return;
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/");
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardTitle>Create account</CardTitle>
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required aria-label="Display name" />
        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required aria-label="Email" />
        <Input type="password" placeholder="Password (min 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} aria-label="Password" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full">Register</Button>
      </form>
    </Card>
  );
}
