export class RequireUtil {
  static defined<T>(value: T | undefined, description: string): T {
    // Why: some tables are complete by construction; a gap there is a bug in the package, so it fails loudly.
    if (value === undefined) {
      throw new Error(`internal error: ${description} is missing`);
    }
    return value;
  }
}
