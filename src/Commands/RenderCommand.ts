import { SceneCommand } from "@/Commands/SceneCommand.ts";

export class RenderCommand extends SceneCommand {
  readonly name = "render";

  protected readonly shouldWrite = true;
}
