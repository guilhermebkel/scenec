export class SceneError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors.join("\n"));
    this.name = "SceneError";
    this.errors = errors;
  }
}
