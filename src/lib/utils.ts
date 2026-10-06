import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SUIT_SYMBOL: Record<string, string> = { H: "♥", D: "♦", C: "♣", S: "♠" };
export const MODE_LABEL: Record<string, string> = {
  KingOfHearts: "King of Hearts",
  Diamonds: "Diamonds",
  Queens: "Queens",
  Turns: "Turns",
  LastTrick: "Last Trick",
  Trix: "Trix",
  FiftyOne: "Fifty One",
};
export const MODE_HELP: Record<string, string> = {
  KingOfHearts: "Capture the K♥ for +150. Hearts can't be led until broken.",
  Diamonds: "+10 per captured ♦. Diamonds can't be led until broken.",
  Queens: "+20 per captured Queen.",
  Turns: "+10 per trick won. All 8 tricks are always played.",
  LastTrick: "+100 to the winner of the final (8th) trick only.",
  Trix: "Get rid of your cards first! 1st: -100, 2nd: -50. J♣ starts. Aces give an extra turn.",
  FiftyOne: "Reach exactly 51 for +510. J reverses, 9 passes, A is 1 or 11.",
};
