export const SELECTOR_MULTIPLIER = 2;

export class ScoreManager {
  static add(totals: number[], roundScores: number[]): number[] {
    return totals.map((t, i) => t + (roundScores[i] ?? 0));
  }

  /** The player that selected the mode receives double points for the round. */
  static applyMultiplier(base: number[], selector: number): number[] {
    return base.map((score, seat) => (seat === selector ? score * SELECTOR_MULTIPLIER : score));
  }

  static multipliers(selector: number, players = 4): number[] {
    return Array.from({ length: players }, (_, seat) => (seat === selector ? SELECTOR_MULTIPLIER : 1));
  }

  /** LOWEST score wins. Ties produce several winners. */
  static winners(totals: number[]): number[] {
    const min = Math.min(...totals);
    return totals.flatMap((t, i) => (t === min ? [i] : []));
  }

  /** Seats sorted by ascending total (best first). */
  static ranking(totals: number[]): number[] {
    return totals.map((_, i) => i).sort((a, b) => totals[a] - totals[b] || a - b);
  }
}
