import { Card, Deck, strengthOf } from "@/game-engine/card";
import { FIFTY_ONE_TARGET, FiftyOneMode, ModeManager } from "@/game-engine/modes";
import type { RoundManager } from "@/game-engine/round";
import { TrickEngine } from "@/game-engine/rules";
import { CardData, Difficulty, ModeId, Move, Suit } from "@/types";

type Rng = () => number;

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Cards that this seat has not seen: not in own hand and not yet played. */
export function unseenCards(round: RoundManager, seat: number): Card[] {
  const known = new Set<string>();
  for (const c of round.hands[seat]) known.add(c.id);
  for (const p of round.plays) known.add(new Card(p.card.suit, p.card.rank).id);
  return Deck.all().filter((c) => !known.has(c.id));
}

export function chooseMove(round: RoundManager, seat: number, difficulty: Difficulty, rng: Rng = Math.random): Move {
  const legal = round.legalMoves(seat);
  if (legal.length === 0) throw new Error("No legal moves");
  if (legal.length === 1) return legal[0];
  if (difficulty === "easy") return pick(legal, rng);
  if (round.isFifty) return chooseFifty(round, seat, legal, difficulty, rng);
  return chooseTrick(round, seat, legal, difficulty, rng);
}

function chooseFifty(round: RoundManager, seat: number, legal: Move[], difficulty: Difficulty, rng: Rng): Move {
  const winning = legal.find((m) => round.total + FiftyOneMode.delta(m) === FIFTY_ONE_TARGET);
  if (winning) return winning;
  if (difficulty === "medium") return pick(legal, rng);

  const unseen = unseenCards(round, seat);
  let best = legal[0];
  let bestScore = -Infinity;
  for (const m of legal) {
    const newTotal = FiftyOneMode.next(round.total, m);
    const remaining = round.hands[seat].filter((c) => !c.equals(m.card));
    let myHits = 0;
    for (const c of remaining) {
      const options: Move[] = c.rank === "A" ? [{ card: c.toJSON(), aceValue: 1 }, { card: c.toJSON(), aceValue: 11 }] : [{ card: c.toJSON() }];
      if (options.some((o) => newTotal + FiftyOneMode.delta(o) === FIFTY_ONE_TARGET)) myHits++;
    }
    let danger = 0;
    for (const c of unseen) {
      const options: Move[] = c.rank === "A" ? [{ card: c.toJSON(), aceValue: 1 }, { card: c.toJSON(), aceValue: 11 }] : [{ card: c.toJSON() }];
      if (options.some((o) => newTotal + FiftyOneMode.delta(o) === FIFTY_ONE_TARGET)) danger++;
    }
    const dangerRate = danger / Math.max(1, unseen.length);
    // Setting up a 51 for ourselves is good only if opponents are unlikely to snatch it first.
    const score = myHits * 3 * (1 - dangerRate * 2) - danger * 2 + (m.card.rank === "J" ? 0.3 : 0) + rng() * 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

function chooseTrick(round: RoundManager, seat: number, legal: Move[], difficulty: Difficulty, rng: Rng): Move {
  const mode = ModeManager.trick(round.mode);
  const trick = round.trick;
  const led: Suit | null = TrickEngine.leadSuit(trick);
  const unseen = difficulty === "hard" ? unseenCards(round, seat) : [];
  const voids = difficulty === "hard" ? TrickEngine.voids([...round.completed.map((t) => t.plays), trick]) : new Map();
  const remainingAfterMe = 3 - trick.length;
  const followers: number[] = [];
  for (let i = 1; i <= remainingAfterMe; i++) followers.push((seat + i) % 4);

  const bestOnTable = trick
    .filter((p) => p.card.suit === led)
    .reduce((m, p) => Math.max(m, strengthOf(p.card.rank)), -1);

  let best = legal[0];
  let bestU = -Infinity;
  for (const m of legal) {
    const c = m.card;
    const suit = led ?? c.suit;
    const str = strengthOf(c.rank);
    const pts = mode.trickPoints([...trick.map((p) => p.card), c]);
    let pWin: number;
    if (c.suit !== suit || str < bestOnTable) {
      pWin = 0;
    } else if (difficulty === "medium") {
      pWin = remainingAfterMe === 0 ? 1 : 0.5;
    } else {
      const holders = [0, 1, 2, 3].filter((s) => s !== seat && !trick.some((p) => p.seat === s) && !voids.get(s)?.has(suit));
      const futureHolders = followers.filter((s) => !voids.get(s)?.has(suit));
      const higher = unseen.filter((u) => u.suit === suit && u.strength > str).length;
      const allHolders = [0, 1, 2, 3].filter((s) => s !== seat && !voids.get(s)?.has(suit));
      const denom = Math.max(1, allHolders.length);
      void holders;
      pWin = Math.pow(Math.max(0, 1 - futureHolders.length / denom), higher);
    }
    let u: number;
    if (mode.avoid) {
      u = -pWin * pts + 0.05 * str * (1 - pWin);
      if (mode.cardPoints(c) > 0) u += (1 - pWin) * 20; // discard the dangerous card onto someone else
    } else {
      u = pWin * pts - (1 - pWin) * mode.cardPoints(c) - 0.02 * str;
    }
    if (difficulty === "medium") u += rng() * 0.5;
    else u += rng() * 0.001;
    if (u > bestU) {
      bestU = u;
      best = m;
    }
  }
  return best;
}

export function chooseMode(remaining: ModeId[], hand: Card[], difficulty: Difficulty, rng: Rng = Math.random): ModeId {
  if (difficulty !== "hard" || remaining.length === 1) return pick(remaining, rng);
  const queens = hand.filter((c) => c.rank === "Q").length;
  const diamonds = hand.filter((c) => c.suit === "D");
  const hasKH = hand.some((c) => c.suit === "H" && c.rank === "K");
  const low = hand.filter((c) => c.strength <= 2 || c.rank === "Q" || c.rank === "K").length;
  const value: Record<ModeId, number> = {
    Queens: queens * 3 + hand.filter((c) => c.strength >= 5).length * 0.5,
    Diamonds: diamonds.length * 1.5 + diamonds.filter((c) => c.strength >= 5).length,
    KingOfHearts: hasKH ? 2 : 3,
    FiftyOne: low * 0.8,
  };
  return [...remaining].sort((a, b) => value[b] + rng() * 0.5 - (value[a] + rng() * 0.5))[0];
}

export type { CardData };
