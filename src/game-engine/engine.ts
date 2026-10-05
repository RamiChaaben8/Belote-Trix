import { Card, Deck } from "./card";
import { Player } from "./players";
import { RoundManager } from "./round";
import { ScoreManager } from "./score";
import { EngineEvent, MODE_IDS, ModeId, Move } from "@/types";

export type Phase = "selecting" | "playing" | "finished";

export interface RoundResult {
  number: number;
  mode: ModeId;
  selector: number;
  scores: number[];
  round: RoundManager;
}

export class GameEngine {
  phase: Phase = "selecting";
  readonly modes: ModeId[] = [...MODE_IDS];
  selector = 0;
  used: ModeId[][] = [[], [], [], []];
  totals: number[] = [0, 0, 0, 0];
  roundNumber = 0;
  pendingHands: Card[][] = [];
  round: RoundManager | null = null;
  results: RoundResult[] = [];

  constructor(
    readonly players: Player[],
    private rng: () => number = Math.random,
  ) {
    if (players.length !== 4) throw new Error("Exactly 4 players required");
  }

  get totalRounds(): number {
    return this.players.length * this.modes.length;
  }

  remainingModes(seat: number): ModeId[] {
    return this.modes.filter((m) => !this.used[seat].includes(m));
  }

  /** Shuffles and deals 8 cards each; the selector must then choose a mode. */
  start(): EngineEvent[] {
    return this.deal();
  }

  private deal(): EngineEvent[] {
    this.pendingHands = new Deck().shuffle(this.rng).deal(4, 8);
    this.phase = "selecting";
    this.round = null;
    return [{ type: "deal_cards", data: { roundNumber: this.roundNumber + 1, selector: this.selector } }];
  }

  selectMode(seat: number, mode: ModeId): EngineEvent[] {
    if (this.phase !== "selecting") throw new Error("Not in selection phase");
    if (seat !== this.selector) throw new Error("You are not the selector");
    if (!this.remainingModes(seat).includes(mode)) throw new Error("Mode unavailable");
    this.used[seat].push(mode);
    this.roundNumber++;
    this.round = new RoundManager(mode, this.pendingHands, seat);
    this.phase = "playing";
    return [{ type: "mode_selected", data: { seat, mode, roundNumber: this.roundNumber } }];
  }

  play(seat: number, move: Move): EngineEvent[] {
    if (this.phase !== "playing" || !this.round) throw new Error("No round in progress");
    const events = this.round.play(seat, move);
    if (this.round.finished) events.push(...this.finishRound());
    return events;
  }

  private finishRound(): EngineEvent[] {
    const r = this.round!;
    const before = [...this.totals];
    this.totals = ScoreManager.add(this.totals, r.scores);
    this.results.push({ number: this.roundNumber, mode: r.mode, selector: this.selector, scores: [...r.scores], round: r });
    const events: EngineEvent[] = [
      { type: "round_finished", data: { roundNumber: this.roundNumber, mode: r.mode, scores: r.scores } },
      { type: "score_updated", data: { totals: this.totals, deltas: this.totals.map((t, i) => t - before[i]) } },
    ];
    if (this.remainingModes(this.selector).length === 0) this.selector++;
    if (this.selector >= this.players.length) {
      this.phase = "finished";
      events.push({ type: "game_finished", data: { totals: this.totals, winners: ScoreManager.winners(this.totals) } });
    } else {
      events.push(...this.deal());
      this.round = r; // keep finished round visible until the selector picks a mode
    }
    return events;
  }

  /** Seat expected to act, or null when the game is finished. */
  actor(): number | null {
    if (this.phase === "selecting") return this.selector;
    if (this.phase === "playing" && this.round && !this.round.finished) return this.round.turn;
    return null;
  }

  /** Cards visible to a seat (null seat means spectator: nothing visible). */
  handOf(seat: number | null): Card[] {
    if (seat === null) return [];
    if (this.phase === "selecting") return this.pendingHands[seat] ?? [];
    return this.round?.hands[seat] ?? [];
  }
}
