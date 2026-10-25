export class FallbackUtil {
  static nonEmpty(value: string | undefined, fallback: string): string {
    // Why: an empty string written by the scene author means "not set", the same as leaving the field out.
    return value === undefined || value === "" ? fallback : value;
  }
}
