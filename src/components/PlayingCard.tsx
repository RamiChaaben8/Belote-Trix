import { cn, SUIT_SYMBOL } from "@/lib/utils";
import type { CardData } from "@/types";

interface Props {
  card?: CardData;
  hidden?: boolean;
  disabled?: boolean;
  highlight?: boolean;
  small?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PlayingCard({ card, hidden, disabled, highlight, small, onClick, className }: Props) {
  const red = card && (card.suit === "H" || card.suit === "D");
  const size = small ? "h-16 w-11 text-sm" : "h-24 w-16 text-lg sm:h-28 sm:w-20 sm:text-xl";
  if (hidden || !card) {
    return (
      <div
        className={cn(size, "rounded-lg border-2 border-white/80 bg-gradient-to-br from-indigo-700 to-indigo-900 shadow-md", className)}
        aria-label="hidden card"
      />
    );
  }
  return (
    <button
      type="button"
      data-testid={`card-${card.rank}${card.suit}`}
      disabled={disabled || !onClick}
      onClick={onClick}
      className={cn(
        size,
        "animate-deal relative flex flex-col justify-between rounded-lg border border-slate-300 bg-white p-1 font-bold shadow-md transition-transform",
        red ? "text-red-600" : "text-slate-900",
        onClick && !disabled && "hover:-translate-y-3 cursor-pointer",
        disabled && onClick && "opacity-50",
        highlight && "ring-4 ring-amber-400",
        className,
      )}
    >
      <span className="leading-none">
        {card.rank}
        <br />
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className="self-end text-2xl leading-none">{SUIT_SYMBOL[card.suit]}</span>
    </button>
  );
}
