export class ClaudeCodeProviderAdapter {
  parseSession(value: string): string {
    return this.sessionService(value);
  }

  private sessionService(value: string): string {
    return value;
  }
}
