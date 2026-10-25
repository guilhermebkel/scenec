export type CurvePoint = readonly [number, number];

export class CurveUtil {
  private static readonly DEFAULT_SAMPLES = 48;

  static catmullRom(
    points: readonly CurvePoint[], samplesPerSegment: number = CurveUtil.DEFAULT_SAMPLES,
  ): CurvePoint[] {
    const first = points[0];
    const last = points.at(-1);
    if (points.length < 2 || first === undefined || last === undefined) {
      return points.slice();
    }
    // Why: the first and last points repeat so the spline starts and ends exactly on them.
    const padded = [first, ...points, last];
    const curve: CurvePoint[] = [];
    for (let index = 1; index < padded.length - 2; index++) {
      const [before, from, to, after] = [padded[index - 1], padded[index], padded[index + 1], padded[index + 2]];
      if (before === undefined || from === undefined || to === undefined || after === undefined) {
        continue;
      }
      for (let step = 0; step < samplesPerSegment; step++) {
        const progress = step / samplesPerSegment;
        curve.push([
          CurveUtil.spline(before[0], from[0], to[0], after[0], progress),
          CurveUtil.spline(before[1], from[1], to[1], after[1], progress),
        ]);
      }
    }
    curve.push(last);
    return curve;
  }

  private static spline(before: number, from: number, to: number, after: number, progress: number): number {
    const squared = progress * progress;
    const cubed = squared * progress;
    return 0.5 * (2 * from + (-before + to) * progress + (2 * before - 5 * from + 4 * to - after) * squared
      + (-before + 3 * from - 3 * to + after) * cubed);
  }
}
