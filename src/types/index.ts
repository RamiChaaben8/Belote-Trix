export const SUITS = ["H", "D", "C", "S"] as const;
export type Suit = (typeof SUITS)[number];
export const RANKS = ["7", "8", "9", "10", "J", "Q", "K", "A"] as const;
export type Rank = (typeof RANKS)[number];
export type ModeId = "KingOfHearts" | "Diamonds" | "Queens" | "FiftyOne";
export type Difficulty = "easy" | "medium" | "hard";

export interface CardData {
  suit: Suit;
  rank: Rank;
}

export interface Move {
  card: CardData;
  /** Only meaningful for an Ace in FiftyOne mode. */
  aceValue?: 1 | 11;
}

export interface Play {
  seat: number;
  card: CardData;
}

export interface PlayRecord extends Play {
  seq: number;
  trickIndex: number;
  total?: number;
  aceValue?: 1 | 11;
}

export interface TrickRecord {
  index: number;
  leader: number;
  plays: Play[];
  winner: number;
  points: number;
}

export interface EngineEvent {
  type: string;
  data: Record<string, unknown>;
}

export const MODE_IDS: ModeId[] = ["KingOfHearts", "Diamonds", "Queens", "FiftyOne"];
