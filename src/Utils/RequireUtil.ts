export class RequireUtil {
  // Why: an index lookup can be undefined for the compiler, but some tables are complete by construction; a gap there is a bug in the package, so it fails loudly.
  static defined<T>(value: T | undefined, description: string): T {
    if (value === undefined) {
      throw new Error(`internal error: ${description} is missing`);
    }
    return value;
  }
}
