"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useSettings } from "@/hooks/useSettings";

export function Navbar() {
  const { data } = useSession();
  const { sound, setSound } = useSettings();
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
        <Link href="/" className="text-lg font-extrabold text-emerald-400">
          ♠ Belote Trix
        </Link>
        <Link href="/leaderboard" className="text-slate-300 hover:text-white">Leaderboard</Link>
        <Link href="/history" className="text-slate-300 hover:text-white">History</Link>
        <Link href="/profile" className="text-slate-300 hover:text-white">Profile</Link>
        <Link href="/settings" className="text-slate-300 hover:text-white">Settings</Link>
        <div className="ml-auto flex items-center gap-3">
          <button aria-label="Toggle sound" onClick={() => setSound(!sound)} className="text-lg" title="Sound effects">
            {sound ? "🔊" : "🔇"}
          </button>
          {data?.user ? (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-slate-300 hover:text-white">
              Sign out ({data.user.name})
            </button>
          ) : (
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
