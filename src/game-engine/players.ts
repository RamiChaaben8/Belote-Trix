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
    return chooseMode(remaining, hand, this.difficulty, rng);
  }
}
