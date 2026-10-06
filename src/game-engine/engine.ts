import { Card, Deck } from "./card";
import { Player } from "./players";
import { RoundManager } from "./round";
import { ScoreManager } from "./score";
import { ModeManager } from "./modes";
import { EngineEvent, GameType, MODE_IDS, ModeId, Move, SwitchState } from "@/types";

export type Phase = "selecting" | "switch_sub" | "switch_target" | "switch_reveal" | "playing" | "finished";

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
  generalBreakdown?: import("./modes").GeneralBreakdown[];
  round: RoundManager;
  /** Switch: the underlying sub-mode (only set when mode === "Switch"). */
  switchSubMode?: ModeId;
  /** Switch: swap pairs [[selectorSeat, targetSeat], [otherA, otherB]] */
  switchSwaps?: [[number, number], [number, number]];
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
  switchWins: number;
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

  /** Active Switch state (non-null during Switch selection / reveal flow). */
  switchState: SwitchState | null = null;

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
    // Switch is unavailable in the first rotation (no completed modes yet)
    return this.modes.filter((m) => {
      if (this.used[seat].includes(m)) return false;
      if (m === "Switch" && !ModeManager.switchAvailable(this.used)) return false;
      return true;
    });
  }

  /** Shuffles and deals 8 cards each; for quick test, auto-selects mode immediately or waits for selector. */
  start(): EngineEvent[] {
    const events = this.deal();
    if (this.gameType === "quick" && this.quickMode && this.quickMode !== "Switch") {
      events.push(...this.selectMode(this.selector, this.quickMode));
    }
    return events;
  }

  private deal(): EngineEvent[] {
    this.pendingHands = new Deck().shuffle(this.rng).deal(4, 8);
    this.phase = "selecting";
    this.round = null;
    this.switchState = null;
    return [{ type: "deal_cards", data: { roundNumber: this.roundNumber + 1, selector: this.selector } }];
  }

  selectMode(seat: number, mode: ModeId): EngineEvent[] {
    if (this.phase !== "selecting") throw new Error("Not in selection phase");
    if (seat !== this.selector) throw new Error("You are not the selector");
    if (!this.remainingModes(seat).includes(mode)) throw new Error("Mode unavailable");

    if (mode === "Switch") {
      if (!ModeManager.switchAvailable(this.used)) {
        throw new Error("Switch requires at least one completed mode");
      }
      this.used[seat].push(mode);
      this.roundNumber++;
      this.phase = "switch_sub";
      this.switchState = {
        phase: "sub_select",
        subMode: null,
        swapTarget: null,
        otherPair: null,
        preSwapHands: null,
        revealCountdown: 10,
      };
      return [{ type: "mode_selected", data: { seat, mode, roundNumber: this.roundNumber } }];
    }

    this.used[seat].push(mode);
    this.roundNumber++;
    this.round = new RoundManager(mode, this.pendingHands, seat);
    this.phase = "playing";
    return [{ type: "mode_selected", data: { seat, mode, roundNumber: this.roundNumber } }];
  }

  /**
   * Switch Step 2: selector picks which already-completed mode to replay.
   */
  selectSwitchSubMode(seat: number, subMode: ModeId): EngineEvent[] {
    if (this.phase !== "switch_sub") throw new Error("Not in Switch sub-mode selection");
    if (seat !== this.selector) throw new Error("You are not the selector");
    if (subMode === "Switch") throw new Error("Cannot select Switch as the sub-mode");
    const completed = ModeManager.completedModes(this.used);
    if (!completed.includes(subMode)) throw new Error("Mode has not been completed yet");
    this.switchState!.subMode = subMode;
    this.phase = "switch_target";
    this.switchState!.phase = "target_select";
    return [{ type: "switch_sub_selected", data: { seat, subMode } }];
  }

  /**
   * Switch Step 3: selector picks which player to swap hands with.
   */
  selectSwitchTarget(seat: number, target: number): EngineEvent[] {
    if (this.phase !== "switch_target") throw new Error("Not in Switch target selection");
    if (seat !== this.selector) throw new Error("You are not the selector");
    if (target === seat) throw new Error("Cannot swap with yourself");
    if (target < 0 || target > 3) throw new Error("Invalid target seat");

    const others = [0, 1, 2, 3].filter((s) => s !== seat && s !== target) as [number, number];
    this.switchState!.swapTarget = target;
    this.switchState!.otherPair = others;
    this.switchState!.preSwapHands = this.pendingHands.map((h) => h.map((c) => c.toJSON()));
    this.switchState!.phase = "reveal";
    this.phase = "switch_reveal";
    this.switchState!.revealCountdown = 10;

    return [
      {
        type: "switch_target_selected",
        data: {
          seat,
          target,
          otherPair: others,
          preSwapHands: this.switchState!.preSwapHands,
        },
      },
    ];
  }

  /**
   * Called every second during the reveal countdown. Decrements counter and
   * fires switch_countdown event. When it hits 0, completes the swap and starts play.
   */
  tickRevealCountdown(): EngineEvent[] {
    if (this.phase !== "switch_reveal" || !this.switchState) return [];
    this.switchState.revealCountdown--;
    if (this.switchState.revealCountdown > 0) {
      return [{ type: "switch_countdown", data: { remaining: this.switchState.revealCountdown } }];
    }
    // Countdown done: perform swap and start play
    return this.executeSwapAndStart();
  }

  /**
   * Performs the hand swap and starts the underlying mode round.
   */
  private executeSwapAndStart(): EngineEvent[] {
    const ss = this.switchState!;
    const selector = this.selector;
    const target = ss.swapTarget!;
    const [otherA, otherB] = ss.otherPair!;

    // Swap selector ↔ target
    const tmp = this.pendingHands[selector];
    this.pendingHands[selector] = this.pendingHands[target];
    this.pendingHands[target] = tmp;

    // Swap otherA ↔ otherB
    const tmp2 = this.pendingHands[otherA];
    this.pendingHands[otherA] = this.pendingHands[otherB];
    this.pendingHands[otherB] = tmp2;

    const subMode = ss.subMode!;
    this.round = new RoundManager(subMode, this.pendingHands, selector);
    this.phase = "playing";
    ss.phase = "playing";

    return [
      {
        type: "switch_swap_complete",
        data: {
          selectorSwap: [selector, target],
          otherSwap: [otherA, otherB],
          subMode,
        },
      },
    ];
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
    const isSwitch = !!this.switchState;
    const isCapot = r.endReason === "Capot" && r.mode !== "General";
    // Capot bypasses the selector multiplier — fixed -100/+100 values stand as-is.
    const multipliers = isCapot
      ? Array(this.players.length).fill(1)
      : ScoreManager.multipliers(this.selector, this.players.length, isSwitch);
    const finalScores = isCapot
      ? [...base]
      : ScoreManager.applyMultiplier(base, this.selector, isSwitch);
    this.totals = ScoreManager.add(this.totals, finalScores);
    const endReason = r.endReason;
    const resultMode: ModeId = isSwitch ? "Switch" : r.mode;
    const result: RoundResult = {
      number: this.roundNumber,
      mode: resultMode,
      selector: this.selector,
      endReason,
      base,
      multipliers,
      scores: finalScores,
      round: r,
      generalBreakdown: r.mode === "General" ? r.generalBreakdown.map((b) => ({ ...b })) : undefined,
    };
    if (isSwitch && this.switchState) {
      result.switchSubMode = this.switchState.subMode ?? undefined;
      const ss = this.switchState;
      if (ss.swapTarget !== null && ss.otherPair !== null) {
        result.switchSwaps = [[this.selector, ss.swapTarget], ss.otherPair];
      }
    }
    this.results.push(result);
    const events: EngineEvent[] = [
      {
        type: "round_finished",
        data: {
          roundNumber: this.roundNumber,
          mode: resultMode,
          selector: this.selector,
          endReason,
          base,
          multipliers,
          scores: finalScores,
          generalBreakdown: r.mode === "General" ? r.generalBreakdown : undefined,
          switchSubMode: result.switchSubMode,
          switchSwaps: result.switchSwaps,
        },
      },
      { type: "score_updated", data: { totals: this.totals, deltas: this.totals.map((t, i) => t - before[i]) } },
    ];
    this.switchState = null;
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
    const stats: PlayerStats[] = this.players.map(() => ({
      modesWon: 0, tricksWon: 0, diamonds: 0, queens: 0, kingHearts: 0,
      fiftyOneWins: 0, turnsTricksWon: 0, lastTrickWins: 0, trixWins: 0, switchWins: 0,
    }));
    for (const res of this.results) {
      const min = Math.min(...res.scores);
      res.scores.forEach((s, seat) => {
        if (s === min) stats[seat].modesWon++;
      });
      const playMode = res.switchSubMode ?? res.mode;
      if (playMode === "FiftyOne") {
        res.base.forEach((b, seat) => {
          if (b > 0) stats[seat].fiftyOneWins++;
        });
        continue;
      }
      if (playMode === "Trix") {
        const trixFirst = res.round.trix?.finishOrder[0] ?? -1;
        if (trixFirst >= 0) stats[trixFirst].trixWins++;
        continue;
      }
      if (res.mode === "Switch") {
        const switchMin = Math.min(...res.scores);
        res.scores.forEach((s, seat) => { if (s === switchMin) stats[seat].switchWins++; });
      }
      for (const t of res.round.completed) {
        stats[t.winner].tricksWon++;
        if (playMode === "Turns" || playMode === "General") stats[t.winner].turnsTricksWon++;
        for (const p of t.plays) {
          if ((playMode === "Diamonds" || playMode === "General") && p.card.suit === "D") stats[t.winner].diamonds++;
          if ((playMode === "Queens" || playMode === "General") && p.card.rank === "Q") stats[t.winner].queens++;
          if ((playMode === "KingOfHearts" || playMode === "General") && p.card.suit === "H" && p.card.rank === "K") stats[t.winner].kingHearts++;
        }
      }
      if ((playMode === "LastTrick" || playMode === "General") && res.round.completed.length === 8) {
        const lastTrickWinner = res.round.completed[7].winner;
        stats[lastTrickWinner].lastTrickWins++;
      }
    }
    return stats;
  }

  /** Seat expected to act, or null when the game is finished. */
  actor(): number | null {
    if (this.phase === "selecting" || this.phase === "switch_sub" || this.phase === "switch_target") return this.selector;
    if (this.phase === "switch_reveal") return null; // nobody acts during countdown
    if (this.phase === "playing" && this.round && !this.round.finished) return this.round.turn;
    return null;
  }

  /** Cards visible to a seat (null seat means spectator: nothing visible). */
  handOf(seat: number | null): Card[] {
    if (seat === null) return [];
    if (
      this.phase === "selecting" ||
      this.phase === "switch_sub" ||
      this.phase === "switch_target" ||
      this.phase === "switch_reveal"
    ) return this.pendingHands[seat] ?? [];
    return this.round?.hands[seat] ?? [];
  }
}
