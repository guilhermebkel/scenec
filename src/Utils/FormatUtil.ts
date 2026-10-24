export class FormatUtil {
  static percent(fraction: number): string {
    return `${Math.round(fraction * 100)}%`;
  }
}
