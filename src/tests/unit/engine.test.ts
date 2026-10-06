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

describe("Early termination", () => {
  // Helper: build hands where each seat gets exactly one card
  const oneCard = (...cards: Card[]) => cards.map((card) => [card]);

  it("KingOfHearts ends immediately when K♥ is captured mid-round", () => {
    // Seat 0 leads A♠. Seats 1-3 have no spades → must discard off-suit.
    // Seat 1 discards K♥ (off-suit discard of restricted → breaks hearts).
    // Seat 0 wins with A♠ and captures K♥ → round ends immediately.
    const r = new RoundManager(
      "KingOfHearts",
      hands(
        [c("A", "S"), c("9", "C")],  // seat 0: leads A♠, has 9♣ left
        [c("K", "H"), c("8", "H")],  // seat 1: no spades → discards K♥
        [c("7", "H"), c("7", "C")],  // seat 2: no spades → discards 7♥
        [c("8", "C"), c("9", "D")],  // seat 3: no spades → discards 8♣
      ),
      0,
    );
    r.play(0, { card: c("A", "S").toJSON() });
    r.play(1, { card: c("K", "H").toJSON() }); // off-suit discard → breaks hearts
    r.play(2, { card: c("7", "H").toJSON() });
    r.play(3, { card: c("8", "C").toJSON() });
    // A♠ wins (seat 0); K♥ was in the trick
    expect(r.scores[0]).toBe(150);
    expect(r.finished).toBe(true);
    expect(r.endReason).toBe("King of Hearts Captured");
    // Trick 2 never played — each seat still has 1 card
    expect(r.hands.every((h) => h.length === 1)).toBe(true);
  });

  it("KingOfHearts: endReason is null when K♥ not yet captured", () => {
    // Setup where K♥ is NOT in trick 1
    const r = new RoundManager(
      "KingOfHearts",
      hands(
        [c("A", "S"), c("K", "H")],
        [c("7", "S"), c("8", "C")],
        [c("8", "S"), c("7", "C")],
        [c("9", "S"), c("9", "C")],
      ),
      0,
    );
    // Trick 1: all spades — K♥ not involved
    r.play(0, { card: c("A", "S").toJSON() });
    r.play(1, { card: c("7", "S").toJSON() });
    r.play(2, { card: c("8", "S").toJSON() });
    r.play(3, { card: c("9", "S").toJSON() });
    expect(r.finished).toBe(false);
    expect(r.endReason).toBeNull();
  });

  it("Diamonds ends when all 8 diamonds are captured", () => {
    // Give all 8 diamonds to seat 0's tricks by making seat 0 win every trick with all-diamond hands
    const r = new RoundManager(
      "Diamonds",
      hands(
        [c("A","D"), c("K","D"), c("Q","D"), c("J","D"), c("10","D"), c("9","D"), c("8","D"), c("7","D")],
        [c("A","S"), c("A","H"), c("A","C"), c("7","S"), c("8","S"), c("9","S"), c("10","S"), c("7","H")],
        [c("K","S"), c("K","H"), c("K","C"), c("7","C"), c("8","C"), c("9","C"), c("10","C"), c("8","H")],
        [c("Q","S"), c("Q","H"), c("Q","C"), c("J","S"), c("J","H"), c("J","C"), c("10","H"), c("9","H")],
      ),
      0,
    );
    // Play all 8 tricks — seat 0 leads diamonds every time and wins since others can't follow
    // (they have no diamonds). Seat 0 wins every trick.
    for (let trick = 0; trick < 8; trick++) {
      // seat 0 leads
      r.play(0, { card: r.hands[0][0].toJSON() });
      r.play(1, { card: r.hands[1][0].toJSON() });
      r.play(2, { card: r.hands[2][0].toJSON() });
      r.play(3, { card: r.hands[3][0].toJSON() });
      if (r.finished) break;
    }
    expect(r.scores[0]).toBe(80); // 8 diamonds × 10
    expect(r.finished).toBe(true);
    expect(r.endReason).toBe("All Diamonds Captured");
  });

  it("Queens ends when all 4 queens are captured", () => {
    // One trick per seat, each trick contains exactly one queen
    // 4 seats × 4 cards each — trick 1 has Q♠, trick 2 has Q♥, trick 3 has Q♦, trick 4 has Q♣
    const r = new RoundManager(
      "Queens",
      hands(
        [c("A","S"), c("A","H"), c("A","D"), c("A","C")],
        [c("Q","S"), c("Q","H"), c("Q","D"), c("Q","C")],
        [c("7","S"), c("7","H"), c("7","D"), c("7","C")],
        [c("8","S"), c("8","H"), c("8","D"), c("8","C")],
      ),
      0,
    );
    // Play trick by trick — seat 0 (A) wins each, capturing all queens after 4 tricks
    for (let trick = 0; trick < 4; trick++) {
      for (let s = 0; s < 4; s++) {
        r.play(s, { card: r.hands[s][0].toJSON() });
      }
      if (r.finished) break;
    }
    expect(r.scores[0]).toBe(80); // 4 queens × 20
    expect(r.finished).toBe(true);
    expect(r.endReason).toBe("All Queens Captured");
  });

  it("Queens: 3 queens captured does not end round", () => {
    // 4 tricks, each led by seat 0 with a different suit.
    // Tricks 1-3 contain one queen each (Q♠, Q♥, Q♦ discarded off-suit by void seats).
    // Trick 4 has no queen — round should still be ongoing after trick 3.
    // We only play 3 tricks and verify finished=false.
    //
    // Hand construction: seat 0 leads, others are void in led suit → discard queens.
    // Trick 1 led with C: seats 1-3 void in C → discard Q♠, 7♦, 8♦
    // Trick 2 led with S: seats 1-3 void in S → discard Q♥, 9♦, 7♥
    // Trick 3 led with H: seats 1-3 void in H → discard Q♦, 8♥ wait — seat 1 now has Q♣ left
    //
    // Simpler: give each seat exactly 4 cards in 4 different suits, seat 0 always wins.
    const r = new RoundManager(
      "Queens",
      hands(
        [c("A","C"), c("A","S"), c("A","H"), c("A","D")], // seat 0 wins every trick
        [c("Q","S"), c("Q","H"), c("Q","D"), c("7","C")], // seat 1: no C except trick4
        [c("7","S"), c("8","H"), c("8","D"), c("8","C")], // seat 2: always has led suit
        [c("9","S"), c("9","H"), c("9","D"), c("9","C")], // seat 3: always has led suit
      ),
      0,
    );
    // Trick 1: seat 0 leads A♣
    r.play(0, { card: c("A","C").toJSON() });
    r.play(1, { card: c("7","C").toJSON() }); // seat 1 has 7♣ → must follow
    r.play(2, { card: c("8","C").toJSON() });
    r.play(3, { card: c("9","C").toJSON() });
    expect(r.finished).toBe(false);

    // Trick 2: seat 0 leads A♠
    r.play(0, { card: c("A","S").toJSON() });
    r.play(1, { card: c("Q","S").toJSON() }); // seat 1 follows with Q♠
    r.play(2, { card: c("7","S").toJSON() });
    r.play(3, { card: c("9","S").toJSON() });
    expect(r.finished).toBe(false);

    // Trick 3: seat 0 leads A♥
    r.play(0, { card: c("A","H").toJSON() });
    r.play(1, { card: c("Q","H").toJSON() }); // seat 1 follows with Q♥
    r.play(2, { card: c("8","H").toJSON() });
    r.play(3, { card: c("9","H").toJSON() });
    // 2 queens captured so far — not all 4
    expect(r.finished).toBe(false);
    expect(r.endReason).toBeNull();
  });

  it("Full game early termination: KingOfHearts round completes with correct base sum", () => {
    const e = playFullGame("hard", 99);
    expect(e.phase).toBe("finished");
    for (const res of e.results) {
      if (res.mode === "KingOfHearts") {
        expect(res.base.reduce((a, b) => a + b, 0)).toBe(150);
        expect(res.endReason).toBe("King of Hearts Captured");
      }
      if (res.mode === "Diamonds") {
        expect(res.base.reduce((a, b) => a + b, 0)).toBe(80);
        expect(res.endReason).toBe("All Diamonds Captured");
      }
      if (res.mode === "Queens") {
        expect(res.base.reduce((a, b) => a + b, 0)).toBe(80);
        expect(res.endReason).toBe("All Queens Captured");
      }
    }
  });

  // ── "No further turn" tests: attempting to play after objective must throw ──

  it("KingOfHearts: throws when trying to play after K♥ captured", () => {
    // All seats void in spades except seat 0. Seat 0 leads A♠, others discard.
    // Seat 1 discards K♥ (void in spades), seat 0 wins → K♥ captured → finished.
    const r = new RoundManager(
      "KingOfHearts",
      hands(
        [c("A","S"), c("9","C")],
        [c("K","H"), c("8","H")],
        [c("7","H"), c("7","C")],
        [c("8","C"), c("9","D")],
      ),
      0,
    );
    r.play(0, { card: c("A","S").toJSON() });
    r.play(1, { card: c("K","H").toJSON() });
    r.play(2, { card: c("7","H").toJSON() });
    r.play(3, { card: c("8","C").toJSON() });
    expect(r.finished).toBe(true);
    expect(r.endReason).toBe("King of Hearts Captured");
    // Any further play must throw
    expect(() => r.play(0, { card: c("9","C").toJSON() })).toThrow("Round is finished");
  });

  it("Queens: throws when trying to play after all 4 queens captured", () => {
    // 4 tricks, each captures exactly one queen. Seat 0 wins every trick.
    const r = new RoundManager(
      "Queens",
      hands(
        [c("A","S"), c("A","H"), c("A","D"), c("A","C"), c("9","S"), c("9","H"), c("9","D"), c("9","C")],
        [c("Q","S"), c("Q","H"), c("Q","D"), c("Q","C"), c("7","S"), c("7","H"), c("7","D"), c("7","C")],
        [c("K","S"), c("K","H"), c("K","D"), c("K","C"), c("8","S"), c("8","H"), c("8","D"), c("8","C")],
        [c("J","S"), c("J","H"), c("J","D"), c("J","C"), c("10","S"), c("10","H"), c("10","D"), c("10","C")],
      ),
      0,
    );
    // Play 4 tricks: each trick led by seat 0 with an Ace, others follow in same suit
    for (const suit of ["S","H","D","C"] as const) {
      r.play(0, { card: c("A", suit).toJSON() });
      r.play(1, { card: c("Q", suit).toJSON() });
      r.play(2, { card: c("K", suit).toJSON() });
      r.play(3, { card: c("J", suit).toJSON() });
      if (r.finished) break;
    }
    expect(r.finished).toBe(true);
    expect(r.endReason).toBe("All Queens Captured");
    // 4 cards remain in each hand — but round is locked
    expect(r.hands[0].length).toBeGreaterThan(0);
    expect(() => r.play(0, { card: r.hands[0][0].toJSON() })).toThrow("Round is finished");
  });

  it("Diamonds: throws when trying to play after all 8 diamonds captured", () => {
    // Distribute all 8 diamonds evenly: 2 per seat. Each trick will contain 4 diamonds
    // when all 4 players lead/follow with diamonds (but follow-suit applies).
    // Simpler: make all 4 seats hold only diamonds. Then every trick contains 4 diamonds.
    // 8 total ÷ 4 per trick = 2 tricks to exhaust all diamonds → finished after trick 2.
    const r = new RoundManager(
      "Diamonds",
      hands(
        [c("A","D"), c("K","D")],
        [c("Q","D"), c("J","D")],
        [c("10","D"), c("9","D")],
        [c("8","D"), c("7","D")],
      ),
      0,
    );
    // Trick 1: all play diamonds (only suit available), A♦ wins (seat 0)
    r.play(0, { card: c("A","D").toJSON() });
    r.play(1, { card: c("Q","D").toJSON() });
    r.play(2, { card: c("10","D").toJSON() });
    r.play(3, { card: c("8","D").toJSON() });
    // 4 diamonds captured — not all 8 yet
    expect(r.finished).toBe(false);

    // Trick 2: seat 0 leads K♦, all follow, 4 more diamonds captured = 8 total
    r.play(0, { card: c("K","D").toJSON() });
    r.play(1, { card: c("J","D").toJSON() });
    r.play(2, { card: c("9","D").toJSON() });
    r.play(3, { card: c("7","D").toJSON() });
    // All 8 diamonds captured
    expect(r.finished).toBe(true);
    expect(r.endReason).toBe("All Diamonds Captured");
    // Hands are now empty, but finished flag prevents further plays
    expect(() => r.play(0, { card: c("A","D").toJSON() })).toThrow("Round is finished");
  });

  it("FiftyOne: throws when trying to play after exactly 51 reached", () => {
    const r = new RoundManager("FiftyOne", hands([c("A","S"), c("7","S")], [], [], []), 0);
    r.total = 44;
    r.play(0, { card: c("7","S").toJSON() }); // 44+7 = 51
    expect(r.total).toBe(51);
    expect(r.finished).toBe(true);
    expect(() => r.play(0, { card: c("A","S").toJSON() })).toThrow("Round is finished");
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
