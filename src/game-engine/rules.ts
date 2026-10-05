import { Card } from "./card";
import { Play, Suit } from "@/types";

export class TrickEngine {
  static leadSuit(trick: Play[]): Suit | null {
    return trick.length ? trick[0].card.suit : null;
  }

  /** Highest card of the led suit wins. */
  static winner(trick: Play[]): number {
    const led = trick[0].card.suit;
    let best = trick[0];
    for (const p of trick) {
      if (p.card.suit === led && Card.from(p.card).strength > Card.from(best.card).strength) best = p;
    }
    return best.seat;
  }

  /** Seats known to be void in a suit (they failed to follow it). */
  static voids(tricks: Play[][]): Map<number, Set<Suit>> {
    const map = new Map<number, Set<Suit>>();
    for (const t of tricks) {
      if (!t.length) continue;
      const led = t[0].card.suit;
      for (const p of t) {
        if (p.card.suit !== led) {
          if (!map.has(p.seat)) map.set(p.seat, new Set());
          map.get(p.seat)!.add(led);
        }
      }
    }
    return map;
  }
}

export class RuleEngine {
  static legalTrickCards(hand: Card[], trick: Play[], restricted: Suit | null, broken: boolean): Card[] {
    if (trick.length > 0) {
      const led = trick[0].card.suit;
      const follow = hand.filter((c) => c.suit === led);
      return follow.length ? follow : [...hand];
    }
    if (restricted && !broken) {
      const free = hand.filter((c) => c.suit !== restricted);
      return free.length ? free : [...hand];
    }
    return [...hand];
  }

  static isDiscardOfRestricted(card: Card, trick: Play[], restricted: Suit | null): boolean {
    return !!restricted && trick.length > 0 && trick[0].card.suit !== card.suit && card.suit === restricted;
  }
}
