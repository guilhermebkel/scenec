export class FormatUtil {
  static readonly oneDecimal = (value: number): string => value.toFixed(1);

  static percent(fraction: number): string {
    return `${Math.round(fraction * 100)}%`;
  }
}
