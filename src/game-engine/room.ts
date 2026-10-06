import { Card } from "./card";
import { BotPlayer, Player } from "./players";
import { GameEngine } from "./engine";
import { Difficulty, EngineEvent, GameType, ModeId, Move } from "@/types";
import { sortCards } from "./card";

export interface ChatEntry {
  author: string;
  seat: number | null;
  content: string;
  at: number;
}

export type RoomStatus = "lobby" | "playing" | "finished";

/** A room holds seats, spectators, chat and (once started) the engine. Pure logic, no sockets. */
export class GameRoom {
  readonly seats: (Player | null)[] = [null, null, null, null];
  readonly spectators = new Map<string, string>();
  readonly chat: ChatEntry[] = [];
  engine: GameEngine | null = null;
  status: RoomStatus = "lobby";
  difficulty: Difficulty = "medium";
  gameType: GameType = "full";
  quickMode: ModeId = "KingOfHearts";
  readonly createdAt = Date.now();
  events: EngineEvent[] = [];
  timer: ReturnType<typeof setTimeout> | null = null;
  saved = false;

  constructor(
    readonly code: string,
    public hostClientId: string,
    private rng: () => number = Math.random,
    gameType: GameType = "full",
    quickMode: ModeId = "KingOfHearts",
  ) {
    this.gameType = gameType;
    this.quickMode = quickMode;
  }

  seatOf(clientId: string): number | null {
    const i = this.seats.findIndex((p) => p?.clientId === clientId);
    return i === -1 ? null : i;
  }

  join(clientId: string, name: string, userId: string | null, avatar: string): { seat: number | null; reconnected: boolean } {
    const existing = this.seatOf(clientId);
    if (existing !== null) {
      const p = this.seats[existing]!;
      p.connected = true;
      p.disconnectedAt = null;
      p.name = name || p.name;
      return { seat: existing, reconnected: true };
    }
    if (this.status === "lobby") {
      const free = this.seats.findIndex((p) => p === null);
      if (free !== -1) {
        this.seats[free] = new Player(free, name, false, clientId, userId, avatar);
        this.spectators.delete(clientId);
        return { seat: free, reconnected: false };
      }
    }
    this.spectators.set(clientId, name);
    return { seat: null, reconnected: false };
  }

  leave(clientId: string): void {
    this.spectators.delete(clientId);
    const seat = this.seatOf(clientId);
    if (seat === null) return;
    if (this.status === "lobby") {
      this.seats[seat] = null;
      if (this.hostClientId === clientId) {
        const nextHost = this.seats.find((p) => p && !p.isBot);
        if (nextHost?.clientId) this.hostClientId = nextHost.clientId;
      }
    } else {
      // In a running game the seat is taken over by a bot with the same seat index.
      const p = this.seats[seat]!;
      const bot = new BotPlayer(seat, p.name + " (bot)", this.difficulty);
      this.seats[seat] = bot;
      if (this.engine) this.engine.players[seat] = bot;
    }
  }

  setConnected(clientId: string, connected: boolean): number | null {
    const seat = this.seatOf(clientId);
    if (seat === null) return null;
    const p = this.seats[seat]!;
    p.connected = connected;
    p.disconnectedAt = connected ? null : Date.now();
    return seat;
  }

  addBot(difficulty: Difficulty = this.difficulty): number | null {
    if (this.status !== "lobby") return null;
    const free = this.seats.findIndex((p) => p === null);
    if (free === -1) return null;
    const names = ["Ava", "Noah", "Mia", "Leo", "Zoe", "Max", "Ivy", "Sam"];
    this.seats[free] = new BotPlayer(free, `${names[(free + this.code.length) % names.length]} 🤖`, difficulty);
    return free;
  }

  fillBots(difficulty: Difficulty = this.difficulty): void {
    while (this.addBot(difficulty) !== null) {
      /* keep filling */
    }
  }

  removeBot(seat: number): void {
    if (this.status === "lobby" && this.seats[seat]?.isBot) this.seats[seat] = null;
  }

  get humanCount(): number {
    return this.seats.filter((p) => p && !p.isBot).length;
  }

  start(): EngineEvent[] {
    if (this.status !== "lobby") throw new Error("Game already started");
    if (this.seats.some((p) => p === null)) throw new Error("All four seats must be filled");
    this.engine = new GameEngine(this.seats as Player[], this.rng, this.gameType, this.gameType === "quick" ? this.quickMode : null);
    this.status = "playing";
    return this.engine.start();
  }

  selectMode(clientId: string, mode: ModeId): EngineEvent[] {
    const seat = this.requireSeat(clientId);
    return this.engine!.selectMode(seat, mode);
  }

  play(clientId: string, move: Move): EngineEvent[] {
    const seat = this.requireSeat(clientId);
    return this.engine!.play(seat, move);
  }

  private requireSeat(clientId: string): number {
    if (!this.engine) throw new Error("Game not started");
    const seat = this.seatOf(clientId);
    if (seat === null) throw new Error("You are not seated");
    return seat;
  }

  /** Executes one automatic action for a bot (or an absent human). */
  autoAct(): EngineEvent[] {
    const e = this.engine;
    if (!e) return [];
    const seat = e.actor();
    if (seat === null) return [];
    const p = this.seats[seat]!;
    const bot = p instanceof BotPlayer ? p : new BotPlayer(seat, p.name, "medium");
    if (e.phase === "selecting") {
      const mode = bot.pickMode(e.remainingModes(seat), null, e.handOf(seat) as Card[], this.rng);
      return e.selectMode(seat, mode);
    }
    return e.play(seat, bot.pickMove(e.round!, this.rng));
  }

  actorIsAuto(graceMs: number): boolean {
    const e = this.engine;
    if (!e) return false;
    const seat = e.actor();
    if (seat === null) return false;
    const p = this.seats[seat]!;
    if (p.isBot) return true;
    return !p.connected && p.disconnectedAt !== null && Date.now() - p.disconnectedAt >= graceMs;
  }

  finish(): void {
    this.status = "finished";
  }

  addChat(author: string, seat: number | null, content: string): ChatEntry {
    const entry = { author, seat, content: content.slice(0, 300), at: Date.now() };
    this.chat.push(entry);
    if (this.chat.length > 200) this.chat.shift();
    return entry;
  }

  /** Serialises the room for a particular viewer. Opponents' hands are never exposed. */
  view(clientId: string) {
    const e = this.engine;
    const seat = this.seatOf(clientId);
    const r = e?.round ?? null;
    const showRound = !!r && (e!.phase === "playing" || e!.phase === "selecting");
    const hand = e && seat !== null ? [...e.handOf(seat)].sort(sortCards) : [];
    const legal = e && seat !== null && e.phase === "playing" && r && !r.finished && r.turn === seat ? r.legalMoves(seat) : [];
    return {
      code: this.code,
      status: this.status,
      host: this.hostClientId,
      isHost: this.hostClientId === clientId,
      difficulty: this.difficulty,
      gameType: this.gameType,
      quickMode: this.quickMode,
      you: seat,
      seats: this.seats.map((p, i) =>
        p
          ? { seat: i, name: p.name, isBot: p.isBot, connected: p.connected, avatar: p.avatar, isHost: p.clientId === this.hostClientId }
          : null,
      ),
      spectators: this.spectators.size,
      phase: e?.phase ?? "lobby",
      selector: e?.selector ?? null,
      used: e?.used ?? [[], [], [], []],
      modes: e?.modes ?? [],
      remaining: e && seat !== null ? e.remainingModes(seat) : [],
      roundNumber: e?.roundNumber ?? 0,
      totalRounds: e?.totalRounds ?? 28,
      totals: e?.totals ?? [0, 0, 0, 0],
      actor: e?.actor() ?? null,
      hand,
      legal,
      handCounts: e ? [0, 1, 2, 3].map((s) => (e.phase === "selecting" ? 8 : r ? r.hands[s].length : 8)) : [0, 0, 0, 0],
      dealer: e ? (e.roundNumber > 0 ? (e.roundNumber - 1) % 4 : 0) : null,
      leader: r ? r.leader : null,
      stats: e ? e.stats() : null,
      round:
        showRound && e!.phase === "playing"
          ? {
              mode: r!.mode,
              trick: r!.trick,
              broken: r!.broken,
              scores: r!.scores,
              total: r!.total,
              direction: r!.direction,
              tricks: r!.completed.map((t) => ({ index: t.index, winner: t.winner, points: t.points, plays: t.plays })),
              fiftyMoves: r!.mode === "FiftyOne"
                ? r!.plays.slice(-10).map((p) => ({
                    seat: p.seat,
                    card: p.card,
                    delta: p.total !== undefined ? (p.total - (r!.plays[p.seq - 1]?.total ?? 0)) : 0,
                    prevTotal: p.total !== undefined ? (r!.plays[p.seq - 1]?.total ?? 0) : 0,
                    newTotal: p.total ?? 0,
                    aceValue: p.aceValue ?? null,
                  }))
                : undefined,
              trixTable: r!.mode === "Trix" ? r!.trix?.table ?? null : null,
              trixFinishOrder: r!.mode === "Trix" ? (r!.trix?.finishOrder ?? []) : [],
            }
          : null,
      history: (e?.results ?? []).map((x) => ({
        number: x.number,
        mode: x.mode,
        selector: x.selector,
        endReason: x.endReason,
        base: x.base,
        multipliers: x.multipliers,
        scores: x.scores,
      })),
      lastRoundResult: e?.results.length ? e.results[e.results.length - 1] : null,
      chat: this.chat.slice(-50),
    };
  }
}
