import { chooseMode, chooseMove } from "@/ai/ai";
import { RoundManager } from "./round";
import { Difficulty, ModeId, Move } from "@/types";

export class Player {
  connected = true;
  disconnectedAt: number | null = null;
  constructor(
    public seat: number,
    public name: string,
    public isBot = false,
    public clientId: string | null = null,
    public userId: string | null = null,
    public avatar = "🙂",
  ) {}
}

export class BotPlayer extends Player {
  constructor(
    seat: number,
    name: string,
    public difficulty: Difficulty,
  ) {
    super(seat, name, true, null, null, "🤖");
  }

  pickMove(round: RoundManager, rng: () => number = Math.random): Move {
    return chooseMove(round, this.seat, this.difficulty, rng);
  }

  pickMode(remaining: ModeId[], round: RoundManager | null, hand: import("./card").Card[], rng: () => number = Math.random): ModeId {
    // Bots never pick Switch autonomously — Switch requires multi-step human interaction
    // (sub-mode selection + target selection). Filter it out unless it's the only option.
    const withoutSwitch = remaining.filter((m) => m !== "Switch");
    const pool = withoutSwitch.length > 0 ? withoutSwitch : remaining;
    return chooseMode(pool, hand, this.difficulty, rng);
  }
}
