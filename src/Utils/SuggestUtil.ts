export class SuggestUtil {
  private static readonly MIN_TOLERANCE = 2;

  private static readonly TOLERANCE_DIVISOR = 3;

  private static readonly DEFAULT_LIMIT = 3;

  static distance(first: string, second: string): number {
    let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
    for (let row = 1; row <= first.length; row++) {
      const current = [row];
      for (let column = 1; column <= second.length; column++) {
        const substitution = (previous[column - 1] ?? 0) + (first[row - 1] === second[column - 1] ? 0 : 1);
        current[column] = Math.min((previous[column] ?? 0) + 1, (current[column - 1] ?? 0) + 1, substitution);
      }
      previous = current;
    }
    return previous[second.length] ?? 0;
  }

  static closest(name: string, candidates: readonly string[], limit = SuggestUtil.DEFAULT_LIMIT): string[] {
    const lowered = name.toLowerCase();
    const tolerance = Math.max(SuggestUtil.MIN_TOLERANCE, Math.ceil(lowered.length / SuggestUtil.TOLERANCE_DIVISOR));
    return candidates
      .map((candidate) => ({ candidate, score: SuggestUtil.distance(lowered, candidate.toLowerCase()) }))
      .filter(({ score }) => score <= tolerance)
      .sort((first, second) => first.score - second.score)
      .slice(0, limit)
      .map(({ candidate }) => candidate);
  }
}
