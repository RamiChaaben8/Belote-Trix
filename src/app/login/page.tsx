"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Input } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setError("Invalid email or password");
    else router.push("/");
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardTitle>Sign in</CardTitle>
      <form onSubmit={submit} className="space-y-3">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-label="Email" />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-label="Password" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
      <p className="mt-3 text-sm text-slate-400">
        No account? <Link href="/register" className="text-emerald-400">Register</Link>
      </p>
    </Card>
  );
}
