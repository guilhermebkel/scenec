import { sceneJsonSchema } from "@/schema.ts";
import { BaseCommand } from "@/Commands/BaseCommand.ts";

export class SchemaCommand extends BaseCommand {
  readonly name = "schema";

  run(): number {
    BaseCommand.print(sceneJsonSchema());
    return BaseCommand.EXIT_OK;
  }
}
