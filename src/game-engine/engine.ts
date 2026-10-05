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
  /** Raw points before the selector multiplier. */
  base: number[];
  multipliers: number[];
  /** Final points (base x multiplier). */
  scores: number[];
  round: RoundManager;
}

export interface PlayerStats {
  modesWon: number;
  tricksWon: number;
  diamonds: number;
  queens: number;
  kingHearts: number;
  fiftyOneWins: number;
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
    const base = [...r.scores];
    const multipliers = ScoreManager.multipliers(this.selector, this.players.length);
    const finalScores = ScoreManager.applyMultiplier(base, this.selector);
    this.totals = ScoreManager.add(this.totals, finalScores);
    this.results.push({ number: this.roundNumber, mode: r.mode, selector: this.selector, base, multipliers, scores: finalScores, round: r });
    const events: EngineEvent[] = [
      {
        type: "round_finished",
        data: { roundNumber: this.roundNumber, mode: r.mode, selector: this.selector, base, multipliers, scores: finalScores },
      },
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

  /** Per-seat statistics over all finished rounds. */
  stats(): PlayerStats[] {
    const stats: PlayerStats[] = this.players.map(() => ({ modesWon: 0, tricksWon: 0, diamonds: 0, queens: 0, kingHearts: 0, fiftyOneWins: 0 }));
    for (const res of this.results) {
      const min = Math.min(...res.scores);
      res.scores.forEach((s, seat) => {
        if (s === min) stats[seat].modesWon++;
      });
      if (res.mode === "FiftyOne") {
        res.base.forEach((b, seat) => {
          if (b > 0) stats[seat].fiftyOneWins++;
        });
        continue;
      }
      for (const t of res.round.completed) {
        stats[t.winner].tricksWon++;
        for (const p of t.plays) {
          if (res.mode === "Diamonds" && p.card.suit === "D") stats[t.winner].diamonds++;
          if (res.mode === "Queens" && p.card.rank === "Q") stats[t.winner].queens++;
          if (res.mode === "KingOfHearts" && p.card.suit === "H" && p.card.rank === "K") stats[t.winner].kingHearts++;
        }
      }
    }
    return stats;
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
