import { BestCommand } from "@/Commands/BestCommand.ts";
import { SceneCommand } from "@/Commands/SceneCommand.ts";
import type { CommandArguments } from "@/Protocols/CommandProtocol.ts";

export class RenderCommand extends SceneCommand {
  readonly name = "render";

  protected readonly shouldWrite = true;

  override run(args: CommandArguments): number {
    if (args.isBest) {
      return new BestCommand().run(args);
    }
    return super.run(args);
  }
}
