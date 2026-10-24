import { SceneCommand } from "@/Commands/SceneCommand.ts";

export class CheckCommand extends SceneCommand {
  readonly name = "check";

  protected readonly shouldWrite = false;
}
