"use client";

export interface Identity {
  clientId: string;
  name: string;
  avatar: string;
}

const KEY = "belote-trix-identity";

export function loadIdentity(): Identity {
  if (typeof window === "undefined") return { clientId: "ssr", name: "Guest", avatar: "🙂" };
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Identity;
    } catch {
      /* regenerate below */
    }
  }
  const id: Identity = {
    clientId: "guest_" + Math.random().toString(36).slice(2) + Date.now().toString(36),
    name: "Guest" + Math.floor(Math.random() * 900 + 100),
    avatar: "🙂",
  };
  localStorage.setItem(KEY, JSON.stringify(id));
  return id;
}

export function saveIdentity(patch: Partial<Identity>): Identity {
  const next = { ...loadIdentity(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
