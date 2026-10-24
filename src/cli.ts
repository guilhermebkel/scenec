#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CATALOG_KINDS, catalog, sceneJsonSchema } from "./schema.ts";
import type { CatalogKind } from "./schema.ts";
import { SceneError } from "./pipeline/parse.ts";
import { check, createFileReader, renderPng } from "./render.ts";

const SCHEMA_VERSION = 1;
const CHARS_PER_TOKEN = 3.6;
const BYTES_PER_KB = 1024;
const DEFAULT_WIDTH = 1200;
const EXIT_FINDINGS = 1;
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

function print(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

function round(value: number, digits = 1): number {
  return Number(value.toFixed(digits));
}

function runScene(file: string, shouldWrite: boolean, output: string | undefined, png: boolean, width: number): number {
  const source = fs.readFileSync(file, "utf8");
  const started = performance.now();
  const result = check(source, { files: createFileReader(path.dirname(path.resolve(file))) });
  const compiled = performance.now();
  const written: Record<string, string> = {};
  let pngKb: number | null = null;
  if (shouldWrite) {
    const base = output ?? path.join("out", path.basename(file).replace(/\.ya?ml$/, ""));
    fs.mkdirSync(path.dirname(base), { recursive: true });
    fs.writeFileSync(`${base}.svg`, result.svg);
    written.svg = `${base}.svg`;
    if (png) {
      const raster = renderPng(result.svg, width);
      fs.writeFileSync(`${base}.png`, raster.png);
      written.png = `${base}.png`;
      pngKb = round(raster.png.length / BYTES_PER_KB);
    }
  }
  const done = performance.now();
  print({
    schemaVersion: SCHEMA_VERSION,
    file,
    written,
    warnings: result.warnings,
    art: result.art,
    description: result.description.split("\n"),
    stats: {
      sceneTokensApprox: Math.round(source.length / CHARS_PER_TOKEN),
      svgTokensApprox: Math.round(result.svg.length / CHARS_PER_TOKEN),
      compileMs: round(compiled - started),
      renderMs: round(done - compiled),
      svgKb: round(result.svg.length / BYTES_PER_KB),
      pngKb,
    },
  });
  return result.warnings.length + result.art.length > 0 ? EXIT_FINDINGS : 0;
}

function main(argv: string[]): number {
  const [command, ...rest] = argv;
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
  if (!command || command === "help" || values.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === "schema") {
    print(sceneJsonSchema());
    return 0;
  }
  if (command === "catalog") {
    const kind = positionals[0] as CatalogKind | undefined;
    if (!kind) {
      print({ kinds: CATALOG_KINDS });
      return 0;
    }
    if (!CATALOG_KINDS.includes(kind)) {
      print({ schemaVersion: SCHEMA_VERSION, errors: [`catalog '${kind}' não existe; use ${CATALOG_KINDS.join(", ")}`] });
      return EXIT_INVALID;
    }
    print(catalog(kind));
    return 0;
  }
  if ((command === "render" || command === "check") && positionals[0]) {
    const file = positionals[0];
    try {
      return runScene(file, command === "render", values.output, values.png, Number(values.width));
    } catch (error) {
      if (error instanceof SceneError) {
        print({ schemaVersion: SCHEMA_VERSION, file, errors: error.errors });
        return EXIT_INVALID;
      }
      throw error;
    }
  }
  process.stderr.write(HELP);
  return EXIT_INVALID;
}

process.exitCode = main(process.argv.slice(2));
