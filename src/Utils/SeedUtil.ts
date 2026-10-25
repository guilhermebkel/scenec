export class SeedUtil {
  private static readonly MULTIPLIER = 1664525;

  private static readonly INCREMENT = 1013904223;

  private static readonly MODULUS = 4294967296;

  static sequence(seed: number): () => number {
    // Why: a linear congruential generator keeps the scatter identical for the same seed on every machine.
    let state = (seed >>> 0) || 1;
    return () => {
      state = (state * SeedUtil.MULTIPLIER + SeedUtil.INCREMENT) >>> 0;
      return state / SeedUtil.MODULUS;
    };
  }
}
