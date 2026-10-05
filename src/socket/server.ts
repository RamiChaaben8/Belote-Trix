import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { decode } from "next-auth/jwt";
import { z } from "zod";
import { GameRoom } from "@/game-engine/room";
import { Difficulty, EngineEvent } from "@/types";
import { saveGame } from "@/services/persistence";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DISCONNECT_GRACE_MS = 15_000;
const rooms = new Map<string, GameRoom>();

function makeCode(): string {
  let code = "";
  do {
    code = Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  } while (rooms.has(code));
  return code;
}

const moveSchema = z.object({
  card: z.object({ suit: z.enum(["H", "D", "C", "S"]), rank: z.enum(["7", "8", "9", "10", "J", "Q", "K", "A"]) }),
  aceValue: z.union([z.literal(1), z.literal(11)]).optional(),
});
const modeSchema = z.enum(["KingOfHearts", "Diamonds", "Queens", "FiftyOne"]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);

interface Ack {
  (res: { ok: boolean; error?: string; code?: string }): void;
}

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function attachSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, { path: "/socket.io", cors: { origin: true, credentials: true } });

  async function broadcast(room: GameRoom) {
    const sockets = await io.in(room.code).fetchSockets();
    for (const s of sockets) s.emit("room_state", room.view(s.data.clientId as string));
  }

  function emitEvents(room: GameRoom, events: EngineEvent[]) {
    for (const e of events) io.to(room.code).emit(e.type, e.data);
    if (events.some((e) => e.type === "game_finished")) {
      room.finish();
      saveGame(room)
        .then((id) => io.to(room.code).emit("game_saved", { gameId: id }))
        .catch((err) => console.error("[persist] failed to save game", err));
    }
  }

  function schedule(room: GameRoom, heavy = false) {
    if (room.timer) clearTimeout(room.timer);
    room.timer = null;
    const e = room.engine;
    if (!e || room.status !== "playing" || e.actor() === null) return;
    const seat = e.actor()!;
    const p = room.seats[seat]!;
    const humanAbsent = !p.isBot && !p.connected;
    if (!p.isBot && !humanAbsent) return;
    const delay = humanAbsent ? Math.max(500, DISCONNECT_GRACE_MS - (Date.now() - (p.disconnectedAt ?? Date.now()))) : heavy ? 1800 : 900;
    room.timer = setTimeout(async () => {
      room.timer = null;
      if (!room.actorIsAuto(DISCONNECT_GRACE_MS)) return schedule(room);
      try {
        const events = room.autoAct();
        emitEvents(room, events);
        await broadcast(room);
        schedule(room, events.some((x) => x.type === "trick_finished" || x.type === "round_finished"));
      } catch (err) {
        console.error("[bot] action failed", err);
      }
    }, delay);
  }

  io.use(async (socket, next) => {
    const auth = socket.handshake.auth as { clientId?: string; name?: string; avatar?: string };
    let clientId = typeof auth.clientId === "string" ? auth.clientId.slice(0, 64) : "";
    let name = typeof auth.name === "string" && auth.name.trim() ? auth.name.trim().slice(0, 24) : "Guest";
    let userId: string | null = null;
    const cookies = socket.handshake.headers.cookie;
    const raw = parseCookie(cookies, "next-auth.session-token") ?? parseCookie(cookies, "__Secure-next-auth.session-token");
    if (raw && process.env.NEXTAUTH_SECRET) {
      try {
        const token = await decode({ token: raw, secret: process.env.NEXTAUTH_SECRET });
        if (token?.uid) {
          userId = token.uid as string;
          clientId = `user_${userId}`;
          name = (token.name as string) || name;
        }
      } catch {
        /* invalid session: treat as guest */
      }
    }
    if (!clientId) return next(new Error("clientId required"));
    socket.data = { clientId, name, userId, avatar: typeof auth.avatar === "string" ? auth.avatar.slice(0, 4) : "🙂" };
    next();
  });

  io.on("connection", (socket: Socket) => {
    const { clientId } = socket.data as { clientId: string; name: string; userId: string | null; avatar: string };
    let currentCode: string | null = null;

    // Reconnect: re-attach to any room where this client is seated.
    for (const room of rooms.values()) {
      if (room.seatOf(clientId) !== null) {
        currentCode = room.code;
        socket.join(room.code);
        const seat = room.setConnected(clientId, true);
        io.to(room.code).emit("player_reconnected", { seat });
        broadcast(room);
        schedule(room);
      }
    }

    const guard =
      <T>(schema: z.ZodType<T>, fn: (data: T, room: GameRoom | null) => void | Promise<void>) =>
      async (payload: unknown, ack?: Ack) => {
        const reply: Ack = typeof ack === "function" ? ack : () => undefined;
        try {
          const data = schema.parse(payload ?? {});
          await fn(data, currentCode ? (rooms.get(currentCode) ?? null) : null);
          reply({ ok: true, code: currentCode ?? undefined });
        } catch (err) {
          reply({ ok: false, error: err instanceof Error ? err.message : "Error" });
        }
      };

    const requireRoom = (room: GameRoom | null): GameRoom => {
      if (!room) throw new Error("You are not in a room");
      return room;
    };
    const requireHost = (room: GameRoom | null): GameRoom => {
      const r = requireRoom(room);
      if (r.hostClientId !== clientId) throw new Error("Only the host can do this");
      return r;
    };

    const joinInto = (room: GameRoom) => {
      const { name, userId, avatar } = socket.data as { name: string; userId: string | null; avatar: string };
      const res = room.join(clientId, name, userId, avatar);
      currentCode = room.code;
      socket.join(room.code);
      if (res.reconnected) io.to(room.code).emit("player_reconnected", { seat: res.seat });
      else io.to(room.code).emit("player_joined", { seat: res.seat, name });
    };

    socket.on(
      "create_room",
      guard(z.object({ difficulty: difficultySchema.optional() }), async (d) => {
        const room = new GameRoom(makeCode(), clientId);
        if (d.difficulty) room.difficulty = d.difficulty as Difficulty;
        rooms.set(room.code, room);
        joinInto(room);
        await broadcast(room);
      }),
    );

    socket.on(
      "join_room",
      guard(z.object({ code: z.string().min(4).max(10) }), async (d) => {
        const room = rooms.get(d.code.toUpperCase());
        if (!room) throw new Error("Room not found");
        joinInto(room);
        await broadcast(room);
        schedule(room);
      }),
    );

    socket.on(
      "leave_room",
      guard(z.object({}), async (_d, room) => {
        const r = requireRoom(room);
        r.leave(clientId);
        socket.leave(r.code);
        io.to(r.code).emit("player_left", { clientId });
        currentCode = null;
        socket.emit("room_state", null);
        if (r.humanCount === 0 && r.spectators.size === 0) {
          if (r.timer) clearTimeout(r.timer);
          rooms.delete(r.code);
        } else {
          await broadcast(r);
          schedule(r);
        }
      }),
    );

    socket.on(
      "set_difficulty",
      guard(z.object({ difficulty: difficultySchema }), async (d, room) => {
        const r = requireHost(room);
        if (r.status !== "lobby") throw new Error("Game already started");
        r.difficulty = d.difficulty;
        await broadcast(r);
      }),
    );

    socket.on(
      "add_bot",
      guard(z.object({ difficulty: difficultySchema.optional() }), async (d, room) => {
        const r = requireHost(room);
        if (r.addBot(d.difficulty) === null) throw new Error("No free seat");
        await broadcast(r);
      }),
    );

    socket.on(
      "remove_bot",
      guard(z.object({ seat: z.number().int().min(0).max(3) }), async (d, room) => {
        const r = requireHost(room);
        r.removeBot(d.seat);
        await broadcast(r);
      }),
    );

    socket.on(
      "fill_bots",
      guard(z.object({}), async (_d, room) => {
        const r = requireHost(room);
        r.fillBots();
        await broadcast(r);
      }),
    );

    socket.on(
      "start_game",
      guard(z.object({}), async (_d, room) => {
        const r = requireHost(room);
        const events = r.start();
        emitEvents(r, events);
        io.to(r.code).emit("game_started", { code: r.code });
        await broadcast(r);
        schedule(r);
      }),
    );

    socket.on(
      "select_mode",
      guard(z.object({ mode: modeSchema }), async (d, room) => {
        const r = requireRoom(room);
        emitEvents(r, r.selectMode(clientId, d.mode));
        await broadcast(r);
        schedule(r);
      }),
    );

    socket.on(
      "play_card",
      guard(moveSchema, async (d, room) => {
        const r = requireRoom(room);
        const events = r.play(clientId, d);
        emitEvents(r, events);
        await broadcast(r);
        schedule(r, events.some((x) => x.type === "trick_finished" || x.type === "round_finished"));
      }),
    );

    socket.on(
      "chat_message",
      guard(z.object({ content: z.string().trim().min(1).max(300) }), async (d, room) => {
        const r = requireRoom(room);
        const seat = r.seatOf(clientId);
        const author = (socket.data as { name: string }).name;
        const entry = r.addChat(author, seat, d.content);
        io.to(r.code).emit("chat_message", entry);
      }),
    );

    socket.on(
      "request_state",
      guard(z.object({}), async (_d, room) => {
        socket.emit("room_state", requireRoom(room).view(clientId));
      }),
    );

    socket.on("disconnect", () => {
      const room = currentCode ? rooms.get(currentCode) : null;
      if (!room) return;
      const seat = room.setConnected(clientId, false);
      if (seat !== null) {
        io.to(room.code).emit("player_disconnected", { seat, graceMs: DISCONNECT_GRACE_MS });
        broadcast(room);
        schedule(room);
      } else {
        room.spectators.delete(clientId);
      }
    });
  });

  // Housekeeping: drop rooms that nobody has been connected to for 30 minutes.
  setInterval(() => {
    for (const room of rooms.values()) {
      const anyone = room.seats.some((p) => p && !p.isBot && p.connected) || room.spectators.size > 0;
      if (!anyone && Date.now() - room.createdAt > 30 * 60_000) {
        if (room.timer) clearTimeout(room.timer);
        rooms.delete(room.code);
      }
    }
  }, 60_000).unref();

  return io;
}
