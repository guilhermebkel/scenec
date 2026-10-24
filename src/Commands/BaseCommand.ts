import type { CommandArguments } from "@/Protocols/CommandProtocol.ts";

export abstract class BaseCommand {
  protected static readonly SCHEMA_VERSION = 1;

  protected static readonly EXIT_OK = 0;

  protected static readonly EXIT_FINDINGS = 1;

  protected static readonly EXIT_INVALID = 2;

  abstract readonly name: string;

  readonly isFileRequired: boolean = false;

  abstract run(args: CommandArguments): number;

  protected static print(value: unknown): void {
    process.stdout.write(JSON.stringify(value, null, 2) + "\n");
  }
}
