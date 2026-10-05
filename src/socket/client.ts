"use client";

import { io, Socket } from "socket.io-client";
import { loadIdentity } from "@/lib/identity";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      autoConnect: true,
      reconnection: true,
      reconnectionDelayMax: 3000,
      auth: (cb) => cb(loadIdentity()),
    });
  }
  return socket;
}

export function emitAck<T = { ok: boolean; error?: string; code?: string }>(event: string, payload: unknown = {}): Promise<T> {
  return new Promise((resolve) => getSocket().emit(event, payload, (res: T) => resolve(res)));
}
