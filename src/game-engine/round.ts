import { Card } from "./card";
import { FIFTY_ONE_REWARD, FIFTY_ONE_TARGET, FiftyOneMode, ModeManager, TrickMode } from "./modes";
import { RuleEngine, TrickEngine } from "./rules";
import { EngineEvent, ModeId, Move, Play, PlayRecord, Suit, TrickRecord } from "@/types";

export class RoundManager {
  readonly mode: ModeId;
  readonly selector: number;
  readonly initialHands: Card[][];
  hands: Card[][];
  turn: number;
  trick: Play[] = [];
  completed: TrickRecord[] = [];
  plays: PlayRecord[] = [];
  broken = false;
  scores: number[] = [0, 0, 0, 0];
  total = 0;
  direction: 1 | -1 = 1;
  finished = false;
  leader: number;

  constructor(mode: ModeId, hands: Card[][], selector: number) {
    this.mode = mode;
    this.selector = selector;
    this.initialHands = hands.map((h) => [...h]);
    this.hands = hands.map((h) => [...h]);
    this.turn = selector;
    this.leader = selector;
  }

  get isFifty(): boolean {
    return this.mode === "FiftyOne";
  }

  private trickMode(): TrickMode {
    return ModeManager.trick(this.mode);
  }

  get restrictedSuit(): Suit | null {
    return this.isFifty ? null : this.trickMode().restrictedSuit;
  }

  legalMoves(seat: number): Move[] {
    if (this.finished) return [];
    const hand = this.hands[seat];
    if (this.isFifty) return FiftyOneMode.legalMoves(hand, this.total);
    return RuleEngine.legalTrickCards(hand, this.trick, this.restrictedSuit, this.broken).map((c) => ({
      card: c.toJSON(),
    }));
  }

  play(seat: number, move: Move): EngineEvent[] {
    if (this.finished) throw new Error("Round is finished");
    if (seat !== this.turn) throw new Error("Not your turn");
    const legal = this.legalMoves(seat);
    let chosen = legal.find(
      (m) =>
        m.card.suit === move.card.suit &&
        m.card.rank === move.card.rank &&
        (!this.isFifty || move.card.rank !== "A" || m.aceValue === move.aceValue),
    );
    if (!chosen && this.isFifty && move.card.rank === "A" && move.aceValue === undefined) {
      chosen = legal.filter((m) => m.card.rank === "A").sort((a, b) => (b.aceValue ?? 0) - (a.aceValue ?? 0))[0];
    }
    if (!chosen) throw new Error("Illegal move");
    const idx = this.hands[seat].findIndex((c) => c.equals(chosen!.card));
    const [card] = this.hands[seat].splice(idx, 1);
    return this.isFifty ? this.applyFifty(seat, card, chosen) : this.applyTrick(seat, card);
  }

  private applyTrick(seat: number, card: Card): EngineEvent[] {
    const events: EngineEvent[] = [];
    if (RuleEngine.isDiscardOfRestricted(card, this.trick, this.restrictedSuit)) {
      if (!this.broken) events.push({ type: "suit_broken", data: { suit: card.suit } });
      this.broken = true;
    }
    this.trick.push({ seat, card: card.toJSON() });
    this.plays.push({ seq: this.plays.length, seat, card: card.toJSON(), trickIndex: this.completed.length });
    events.push({ type: "card_played", data: { seat, card: card.toJSON() } });
    if (this.trick.length === 4) {
      const winner = TrickEngine.winner(this.trick);
      const points = this.trickMode().trickPoints(this.trick.map((p) => p.card));
      this.scores[winner] += points;
      const rec: TrickRecord = {
        index: this.completed.length,
        leader: this.leader,
        plays: [...this.trick],
        winner,
        points,
      };
      this.completed.push(rec);
      events.push({ type: "trick_finished", data: { ...rec } });
      this.trick = [];
      this.leader = winner;
      this.turn = winner;
      if (this.hands.every((h) => h.length === 0)) this.finished = true;
    } else {
      this.turn = (seat + 1) % 4;
    }
    return events;
  }

  private applyFifty(seat: number, card: Card, move: Move): EngineEvent[] {
    const events: EngineEvent[] = [];
    this.total = FiftyOneMode.next(this.total, move);
    if (card.rank === "J") this.direction = (this.direction * -1) as 1 | -1;
    this.plays.push({
      seq: this.plays.length,
      seat,
      card: card.toJSON(),
      trickIndex: -1,
      total: this.total,
      aceValue: move.aceValue,
    });
    events.push({
      type: "card_played",
      data: { seat, card: card.toJSON(), total: this.total, direction: this.direction, aceValue: move.aceValue ?? null },
    });
    if (this.total === FIFTY_ONE_TARGET) {
      this.scores[seat] += FIFTY_ONE_REWARD;
      this.finished = true;
      return events;
    }
    let next = seat;
    for (let i = 0; i < 4; i++) {
      next = (next + this.direction + 4) % 4;
      if (this.legalMoves(next).length > 0) {
        this.turn = next;
        return events;
      }
      if (this.hands[next].length > 0) events.push({ type: "player_skipped", data: { seat: next } });
    }
    this.finished = true;
    return events;
  }
}
