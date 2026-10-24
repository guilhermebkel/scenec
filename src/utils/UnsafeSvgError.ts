export class UnsafeSvgError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "UnsafeSvgError";
  }
}
