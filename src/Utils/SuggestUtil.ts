export class SuggestUtil {
  static distance(a: string, b: string): number {
    const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) {
      rows[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        rows[i][j] = Math.min(
          rows[i - 1][j] + 1,
          rows[i][j - 1] + 1,
          rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
    }
    return rows[a.length][b.length];
  }

  static closest(name: string, candidates: readonly string[], limit = 3): string[] {
    const lower = name.toLowerCase();
    const maxDistance = Math.max(2, Math.ceil(lower.length / 3));
    return candidates
      .map((candidate) => ({ candidate, score: SuggestUtil.distance(lower, candidate.toLowerCase()) }))
      .filter(({ score }) => score <= maxDistance)
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map(({ candidate }) => candidate);
  }
}
