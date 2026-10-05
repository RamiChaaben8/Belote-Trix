export class ScoreManager {
  static add(totals: number[], roundScores: number[]): number[] {
    return totals.map((t, i) => t + (roundScores[i] ?? 0));
  }

  /** Seats holding the highest total (ties produce several winners). */
  static winners(totals: number[]): number[] {
    const max = Math.max(...totals);
    return totals.flatMap((t, i) => (t === max ? [i] : []));
  }
}
