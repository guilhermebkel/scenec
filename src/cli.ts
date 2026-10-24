#!/usr/bin/env node
import { parseArgs } from "node:util";
import { CATALOG_KINDS } from "@/schema.ts";
import { CatalogCommand } from "@/Commands/CatalogCommand.ts";
import { CheckCommand } from "@/Commands/CheckCommand.ts";
import { RenderCommand } from "@/Commands/RenderCommand.ts";
import { SchemaCommand } from "@/Commands/SchemaCommand.ts";
import type { BaseCommand } from "@/Commands/BaseCommand.ts";

const DEFAULT_WIDTH = 1200;
const EXIT_INVALID = 2;

const HELP = `scenec: turns a YAML scene into an illustrated SVG.

  scenec render <scene.yaml> [-o <output without extension>] [--png] [--width 1200]
      Compiles and writes the SVG (and a PNG with --png). Prints the JSON report.
  scenec check <scene.yaml>
      Compiles and critiques without writing files. Exit code 1 when there is a warning or a critique.
  scenec catalog [${CATALOG_KINDS.join("|")}]
      Lists the vocabulary a scene can use.
  scenec schema
      Prints the JSON Schema of the scene.
`;

const COMMANDS: BaseCommand[] = [new RenderCommand(), new CheckCommand(), new CatalogCommand(), new SchemaCommand()];

function main(argv: string[]): number {
  const [name, ...rest] = argv;
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      output: { type: "string", short: "o" },
      png: { type: "boolean", default: false },
      width: { type: "string", default: String(DEFAULT_WIDTH) },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (!name || name === "help" || values.help) {
    process.stdout.write(HELP);
    return 0;
  }
  const command = COMMANDS.find((candidate) => candidate.name === name);
  if (!command || (command.isFileRequired && !positionals[0])) {
    process.stderr.write(HELP);
    return EXIT_INVALID;
  }
  return command.run({ positionals, output: values.output, shouldWritePng: values.png, width: Number(values.width) });
}

process.exitCode = main(process.argv.slice(2));
