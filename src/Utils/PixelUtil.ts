export class PixelUtil {
  static read(values: ArrayLike<number>, index: number): number {
    return values[index] ?? 0;
  }
}
