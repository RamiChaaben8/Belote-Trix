import { Card, Deck } from "./card";
import { Player } from "./players";
import { RoundManager } from "./round";
import { ScoreManager } from "./score";
import { EngineEvent, GameType, MODE_IDS, ModeId, Move } from "@/types";

export type Phase = "selecting" | "playing" | "finished";

export interface RoundResult {
  number: number;
  mode: ModeId;
  selector: number;
  /** Human-readable reason the round ended (e.g. "King of Hearts Captured"). */
  endReason: string | null;
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
  turnsTricksWon: number;
  lastTrickWins: number;
  trixWins: number;
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
  readonly gameType: GameType;
  readonly quickMode: ModeId | null;

  constructor(
    readonly players: Player[],
    private rng: () => number = Math.random,
    gameType: GameType = "full",
    quickMode: ModeId | null = null,
  ) {
    if (players.length !== 4) throw new Error("Exactly 4 players required");
    this.gameType = gameType;
    this.quickMode = quickMode;
  }

  get totalRounds(): number {
    return this.gameType === "quick" ? 1 : this.players.length * this.modes.length;
  }

  remainingModes(seat: number): ModeId[] {
    if (this.gameType === "quick" && this.quickMode) {
      return this.used[seat].includes(this.quickMode) ? [] : [this.quickMode];
    }
    return this.modes.filter((m) => !this.used[seat].includes(m));
  }

  /** Shuffles and deals 8 cards each; for quick test, auto-selects mode immediately or waits for selector. */
  start(): EngineEvent[] {
    const events = this.deal();
    if (this.gameType === "quick" && this.quickMode) {
      events.push(...this.selectMode(this.selector, this.quickMode));
    }
    return events;
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
    const isCapot = r.endReason === "Capot";
    // Capot bypasses the selector multiplier — fixed -100/+100 values stand as-is.
    const multipliers = isCapot
      ? Array(this.players.length).fill(1)
      : ScoreManager.multipliers(this.selector, this.players.length);
    const finalScores = isCapot
      ? [...base]
      : ScoreManager.applyMultiplier(base, this.selector);
    this.totals = ScoreManager.add(this.totals, finalScores);
    const endReason = r.endReason;
    this.results.push({ number: this.roundNumber, mode: r.mode, selector: this.selector, endReason, base, multipliers, scores: finalScores, round: r });
    const events: EngineEvent[] = [
      {
        type: "round_finished",
        data: { roundNumber: this.roundNumber, mode: r.mode, selector: this.selector, endReason, base, multipliers, scores: finalScores },
      },
      { type: "score_updated", data: { totals: this.totals, deltas: this.totals.map((t, i) => t - before[i]) } },
    ];
    if (this.gameType === "quick" || this.roundNumber >= this.totalRounds) {
      this.phase = "finished";
      events.push({ type: "game_finished", data: { totals: this.totals, winners: ScoreManager.winners(this.totals) } });
      return events;
    }
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
    const stats: PlayerStats[] = this.players.map(() => ({ modesWon: 0, tricksWon: 0, diamonds: 0, queens: 0, kingHearts: 0, fiftyOneWins: 0, turnsTricksWon: 0, lastTrickWins: 0, trixWins: 0 }));
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
      if (res.mode === "Trix") {
        // 1st place finisher (-100 base) counts as a trixWin
        const trixFirst = res.round.trix?.finishOrder[0] ?? -1;
        if (trixFirst >= 0) stats[trixFirst].trixWins++;
        continue;
      }
      for (const t of res.round.completed) {
        stats[t.winner].tricksWon++;
        if (res.mode === "Turns") stats[t.winner].turnsTricksWon++;
        for (const p of t.plays) {
          if (res.mode === "Diamonds" && p.card.suit === "D") stats[t.winner].diamonds++;
          if (res.mode === "Queens" && p.card.rank === "Q") stats[t.winner].queens++;
          if (res.mode === "KingOfHearts" && p.card.suit === "H" && p.card.rank === "K") stats[t.winner].kingHearts++;
        }
      }
      if (res.mode === "LastTrick" && res.round.completed.length === 8) {
        const lastTrickWinner = res.round.completed[7].winner;
        stats[lastTrickWinner].lastTrickWins++;
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
