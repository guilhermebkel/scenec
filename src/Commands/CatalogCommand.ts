import { CATALOG_KINDS, catalog } from "@/schema.ts";
import type { CatalogKind } from "@/schema.ts";
import { BaseCommand } from "@/Commands/BaseCommand.ts";
import type { CommandArguments } from "@/Protocols/CommandProtocol.ts";

export class CatalogCommand extends BaseCommand {
  readonly name = "catalog";

  run(args: CommandArguments): number {
    const kind = args.positionals[0] as CatalogKind | undefined;
    if (!kind) {
      BaseCommand.print({ kinds: CATALOG_KINDS });
      return BaseCommand.EXIT_OK;
    }
    if (!CATALOG_KINDS.includes(kind)) {
      BaseCommand.print({
        schemaVersion: BaseCommand.SCHEMA_VERSION,
        errors: [`catalog '${kind}' does not exist; use ${CATALOG_KINDS.join(", ")}`],
      });
      return BaseCommand.EXIT_INVALID;
    }
    BaseCommand.print(catalog(kind));
    return BaseCommand.EXIT_OK;
  }
}
