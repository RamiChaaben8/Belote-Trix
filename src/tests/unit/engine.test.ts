import { describe, expect, it } from "vitest";
import { BotPlayer, Card, Deck, FiftyOneMode, GameEngine, GameRoom, ModeManager, RoundManager, RuleEngine, TrickEngine, mulberry32 } from "@/game-engine";
import { chooseMode, chooseMove } from "@/ai/ai";
import { Difficulty, MODE_IDS, ModeId } from "@/types";

const c = (rank: string, suit: string) => new Card(suit as never, rank as never);
const hands = (...h: Card[][]) => h;

describe("Deck", () => {
  it("has 32 unique cards and deals 8 each", () => {
    const d = new Deck();
    expect(new Set(d.cards.map((x) => x.id)).size).toBe(32);
    const dealt = d.shuffle(mulberry32(1)).deal();
    expect(dealt.map((h) => h.length)).toEqual([8, 8, 8, 8]);
  });
});

describe("TrickEngine / RuleEngine", () => {
  it("orders A > 10 > K > Q > J > 9 > 8 > 7", () => {
    const order = ["A", "10", "K", "Q", "J", "9", "8", "7"].map((r) => c(r, "S").strength);
    expect([...order].sort((a, b) => b - a)).toEqual(order);
  });
  it("highest card of led suit wins", () => {
    const w = TrickEngine.winner([
      { seat: 0, card: c("9", "S") },
      { seat: 1, card: c("A", "H") },
      { seat: 2, card: c("10", "S") },
      { seat: 3, card: c("7", "S") },
    ]);
    expect(w).toBe(2);
  });
  it("must follow suit", () => {
    const legal = RuleEngine.legalTrickCards([c("7", "S"), c("A", "H")], [{ seat: 0, card: c("9", "S") }], null, false);
    expect(legal.map((x) => x.id)).toEqual(["7S"]);
  });
  it("may play anything when void", () => {
    const legal = RuleEngine.legalTrickCards([c("7", "D"), c("A", "H")], [{ seat: 0, card: c("9", "S") }], null, false);
    expect(legal).toHaveLength(2);
  });
});

describe("KingOfHearts", () => {
  it("restricts leading hearts until broken", () => {
    const r = new RoundManager("KingOfHearts", hands([c("A", "H"), c("7", "S")], [c("8", "C")], [c("8", "D")], [c("9", "D")]), 0);
    expect(r.legalMoves(0).map((m) => m.card.suit)).toEqual(["S"]);
  });
  it("allows leading hearts when only hearts remain", () => {
    const r = new RoundManager("KingOfHearts", hands([c("A", "H")], [], [], []), 0);
    expect(r.legalMoves(0)).toHaveLength(1);
  });
  it("breaks hearts on discard and awards 150 to King capturer", () => {
    const r = new RoundManager(
      "KingOfHearts",
      hands([c("A", "S")], [c("K", "H")], [c("7", "S")], [c("8", "S")]),
      0,
    );
    r.play(0, { card: c("A", "S").toJSON() });
    r.play(1, { card: c("K", "H").toJSON() });
    expect(r.broken).toBe(true);
    r.play(2, { card: c("7", "S").toJSON() });
    r.play(3, { card: c("8", "S").toJSON() });
    expect(r.scores).toEqual([150, 0, 0, 0]);
    expect(r.finished).toBe(true);
  });
});

describe("Diamonds and Queens", () => {
  it("scores 10 per diamond", () => {
    const r = new RoundManager("Diamonds", hands([c("A", "D")], [c("7", "D")], [c("8", "D")], [c("9", "D")]), 0);
    for (let s = 0; s < 4; s++) r.play(s, r.legalMoves(s)[0]);
    expect(r.scores[0]).toBe(40);
  });
  it("scores 20 per queen", () => {
    const r = new RoundManager("Queens", hands([c("A", "S")], [c("Q", "S")], [c("Q", "H")], [c("7", "S")]), 0);
    for (let s = 0; s < 4; s++) r.play(s, r.legalMoves(s)[0]);
    expect(r.scores[0]).toBe(40);
  });
  it("mode manager exposes point rules", () => {
    expect(ModeManager.trick("Queens").cardPoints(c("Q", "C"))).toBe(20);
  });
});

describe("FiftyOne", () => {
  it("applies card values", () => {
    const d = (rank: string, aceValue?: 1 | 11) => FiftyOneMode.delta({ card: c(rank, "S").toJSON(), aceValue });
    expect([d("7"), d("8"), d("9"), d("10"), d("J"), d("Q"), d("K"), d("A", 1), d("A", 11)]).toEqual([7, 8, 0, -10, 0, 3, 4, 1, 11]);
  });
  it("reverses on Jack", () => {
    const r = new RoundManager("FiftyOne", hands([c("7", "S"), c("9", "D")], [c("8", "S"), c("9", "C")], [c("J", "S"), c("9", "S")], [c("7", "H"), c("8", "H")]), 0);
    r.play(0, { card: c("7", "S").toJSON() });
    r.play(1, { card: c("8", "S").toJSON() });
    expect(r.turn).toBe(2);
    r.play(2, { card: c("J", "S").toJSON() });
    expect(r.direction).toBe(-1);
    expect(r.turn).toBe(1);
  });
  it("forbids exceeding 51 when another move exists and awards 510 at exactly 51", () => {
    const r = new RoundManager("FiftyOne", hands([c("A", "S"), c("7", "S")], [], [], []), 0);
    r.total = 44;
    const moves = r.legalMoves(0);
    expect(moves.some((m) => m.card.rank === "A" && m.aceValue === 11)).toBe(false);
    r.play(0, { card: c("7", "S").toJSON() });
    expect(r.total).toBe(51);
    expect(r.scores[0]).toBe(510);
    expect(r.finished).toBe(true);
  });
  it("skips players without legal moves", () => {
    const r = new RoundManager("FiftyOne", hands([c("9", "S"), c("7", "D")], [c("8", "S")], [c("7", "S")], [c("9", "H")]), 0);
    r.total = 45;
    const next = r.play(0, { card: c("9", "S").toJSON() });
    expect(next.length).toBeGreaterThan(0);
    expect(r.legalMoves(r.turn).length).toBeGreaterThan(0);
  });
});

function playFullGame(difficulty: Difficulty, seed: number): GameEngine {
  const rng = mulberry32(seed);
  const players = [0, 1, 2, 3].map((i) => new BotPlayer(i, `B${i}`, difficulty));
  const e = new GameEngine(players, rng);
  e.start();
  let guard = 0;
  while (e.phase !== "finished" && guard++ < 5000) {
    const seat = e.actor()!;
    if (e.phase === "selecting") {
      e.selectMode(seat, chooseMode(e.remainingModes(seat), e.handOf(seat), difficulty, rng));
    } else {
      e.play(seat, chooseMove(e.round!, seat, difficulty, rng));
    }
  }
  return e;
}

describe("GameEngine full matches", () => {
  for (const diff of ["easy", "medium", "hard"] as Difficulty[]) {
    it(`completes 16 rounds with ${diff} bots`, () => {
      for (let seed = 1; seed <= 5; seed++) {
        const e = playFullGame(diff, seed);
        expect(e.phase).toBe("finished");
        expect(e.results).toHaveLength(16);
        for (let s = 0; s < 4; s++) expect([...e.used[s]].sort()).toEqual([...MODE_IDS].sort() as ModeId[]);
      }
    });
  }
  it("each non-FiftyOne round distributes its full base points and multiplies selector by 2", () => {
    const e = playFullGame("medium", 42);
    for (const r of e.results) {
      const baseSum = r.base.reduce((a, b) => a + b, 0);
      if (r.mode === "KingOfHearts") expect(baseSum).toBe(150);
      if (r.mode === "Diamonds") expect(baseSum).toBe(80);
      if (r.mode === "Queens") expect(baseSum).toBe(80);
      // Selector score is doubled
      expect(r.scores[r.selector]).toBe(r.base[r.selector] * 2);
    }
  });
  it("rejects out-of-turn actions", () => {
    const players = [0, 1, 2, 3].map((i) => new BotPlayer(i, `B${i}`, "easy"));
    const e = new GameEngine(players, mulberry32(3));
    e.start();
    expect(() => e.selectMode(1, "Queens")).toThrow();
    e.selectMode(0, "Queens");
    expect(() => e.play(2, e.round!.legalMoves(2)[0])).toThrow();
  });
});

describe("GameRoom", () => {
  it("fills seats with bots, starts, hides opponent hands and supports reconnect", () => {
    const room = new GameRoom("ABCD12", "u1", mulberry32(9));
    room.join("u1", "Alice", null, "🙂");
    room.fillBots("easy");
    room.start();
    const v = room.view("u1");
    expect(v.you).toBe(0);
    expect(v.hand).toHaveLength(8);
    expect(JSON.stringify(v)).not.toContain("hands");
    room.setConnected("u1", false);
    expect(room.seats[0]!.connected).toBe(false);
    expect(room.join("u1", "Alice", null, "🙂").reconnected).toBe(true);
    expect(room.seats[0]!.connected).toBe(true);
  });
  it("auto-plays bot turns to completion", () => {
    const room = new GameRoom("ZZZZ99", "bot", mulberry32(5));
    room.fillBots("hard");
    room.start();
    let guard = 0;
    while (room.engine!.phase !== "finished" && guard++ < 5000) room.autoAct();
    expect(room.engine!.phase).toBe("finished");
  });
});
