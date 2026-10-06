export const SELECTOR_MULTIPLIER = 2;
export const SWITCH_MULTIPLIER = 2;
export const STAR_MULTIPLIER = 2;

export class ScoreManager {
  static add(totals: number[], roundScores: number[]): number[] {
    return totals.map((t, i) => t + (roundScores[i] ?? 0));
  }

  /**
   * Apply per-seat multipliers to base scores.
   *
   * Multiplier stacking order (all multiplicative):
   *   selector bonus: ×2 always (unless Capot)
   *   Switch bonus:   ×2 for ALL seats when inside a Switch round
   *   Star bonus:     ×2 for ALL seats when inside a Star round
   *
   * Examples:
   *   Normal round, selector:       base × 2
   *   Switch round, non-selector:   base × 2   (switch)
   *   Switch round, selector:       base × 2 × 2 = ×4
   *   Star round, non-selector:     base × 2   (star)
   *   Star round, selector:         base × 2 × 2 = ×4
   *   Star(Switch) round, non-sel:  base × 2 × 2 = ×4   (switch × star)
   *   Star(Switch) round, selector: base × 2 × 2 × 2 = ×8
   */
  static applyMultiplier(
    base: number[],
    selector: number,
    isSwitch = false,
    isStar = false,
  ): number[] {
    const switchBonus = isSwitch ? SWITCH_MULTIPLIER : 1;
    const starBonus = isStar ? STAR_MULTIPLIER : 1;
    return base.map((score, seat) =>
      seat === selector
        ? score * SELECTOR_MULTIPLIER * switchBonus * starBonus
        : score * switchBonus * starBonus,
    );
  }

  static multipliers(
    selector: number,
    players = 4,
    isSwitch = false,
    isStar = false,
  ): number[] {
    const switchBonus = isSwitch ? SWITCH_MULTIPLIER : 1;
    const starBonus = isStar ? STAR_MULTIPLIER : 1;
    return Array.from({ length: players }, (_, seat) =>
      seat === selector
        ? SELECTOR_MULTIPLIER * switchBonus * starBonus
        : 1 * switchBonus * starBonus,
    );
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
