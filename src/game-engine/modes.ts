import { Card } from "./card";
import { CardData, ModeId, Move, Suit } from "@/types";

export abstract class TrickMode {
  abstract readonly id: ModeId;
  abstract readonly restrictedSuit: Suit | null;
  /** True when capturing this mode's cards is undesirable for AI heuristics. */
  abstract readonly avoid: boolean;
  abstract cardPoints(card: CardData): number;
  trickPoints(cards: CardData[]): number {
    return cards.reduce((s, c) => s + this.cardPoints(c), 0);
  }
  /**
   * Returns a human-readable end-reason string if the completed tricks
   * satisfy an early-termination condition, or null if the round should continue.
   * `completedTricks` is the full list of tricks finished so far (including the latest).
   */
  abstract earlyTermination(completedTricks: { plays: { card: CardData }[] }[]): string | null;
}

export class KingOfHeartsMode extends TrickMode {
  readonly id = "KingOfHearts" as const;
  readonly restrictedSuit: Suit = "H";
  readonly avoid = true;
  cardPoints(c: CardData): number {
    return c.suit === "H" && c.rank === "K" ? 150 : 0;
  }
  earlyTermination(completedTricks: { plays: { card: CardData }[] }[]): string | null {
    for (const t of completedTricks) {
      if (t.plays.some((p) => p.card.suit === "H" && p.card.rank === "K")) {
        return "King of Hearts Captured";
      }
    }
    return null;
  }
}

export class DiamondsMode extends TrickMode {
  readonly id = "Diamonds" as const;
  readonly restrictedSuit: Suit = "D";
  readonly avoid = true;
  /** Total diamonds in a 32-card deck = 8 (7♦ 8♦ 9♦ 10♦ J♦ Q♦ K♦ A♦). */
  private static readonly TOTAL_DIAMONDS = 8;
  cardPoints(c: CardData): number {
    return c.suit === "D" ? 10 : 0;
  }
  earlyTermination(completedTricks: { plays: { card: CardData }[] }[]): string | null {
    let captured = 0;
    for (const t of completedTricks) {
      for (const p of t.plays) {
        if (p.card.suit === "D") captured++;
      }
    }
    return captured >= DiamondsMode.TOTAL_DIAMONDS ? "All Diamonds Captured" : null;
  }
}

export class QueensMode extends TrickMode {
  readonly id = "Queens" as const;
  readonly restrictedSuit = null;
  readonly avoid = true;
  /** Total queens in deck = 4 (Q♥ Q♦ Q♣ Q♠). */
  private static readonly TOTAL_QUEENS = 4;
  cardPoints(c: CardData): number {
    return c.rank === "Q" ? 20 : 0;
  }
  earlyTermination(completedTricks: { plays: { card: CardData }[] }[]): string | null {
    let captured = 0;
    for (const t of completedTricks) {
      for (const p of t.plays) {
        if (p.card.rank === "Q") captured++;
      }
    }
    return captured >= QueensMode.TOTAL_QUEENS ? "All Queens Captured" : null;
  }
}

export const FIFTY_ONE_TARGET = 51;
export const FIFTY_ONE_REWARD = 510;

export class FiftyOneMode {
  readonly id = "FiftyOne" as const;

  /** Delta applied to the center score by a move. */
  static delta(move: Move): number {
    switch (move.card.rank) {
      case "7": return 7;
      case "8": return 8;
      case "9": return 0;
      case "10": return -10;
      case "J": return 0;
      case "Q": return 3;
      case "K": return 4;
      case "A": return move.aceValue === 11 ? 11 : 1;
    }
  }

  /** All candidate moves for a hand, filtered so that the total never exceeds 51. */
  static legalMoves(hand: Card[], total: number): Move[] {
    const moves: Move[] = [];
    for (const c of hand) {
      if (c.rank === "A") {
        for (const v of [1, 11] as const) moves.push({ card: c.toJSON(), aceValue: v });
      } else {
        moves.push({ card: c.toJSON() });
      }
    }
    return moves.filter((m) => total + FiftyOneMode.delta(m) <= FIFTY_ONE_TARGET);
  }

  static next(total: number, move: Move): number {
    return Math.max(0, total + FiftyOneMode.delta(move));
  }
}

export class ModeManager {
  private static trickModes: Record<Exclude<ModeId, "FiftyOne">, TrickMode> = {
    KingOfHearts: new KingOfHeartsMode(),
    Diamonds: new DiamondsMode(),
    Queens: new QueensMode(),
  };

  static isTrickMode(id: ModeId): boolean {
    return id !== "FiftyOne";
  }

  static trick(id: ModeId): TrickMode {
    if (id === "FiftyOne") throw new Error("FiftyOne is not a trick mode");
    return ModeManager.trickModes[id];
  }
}
