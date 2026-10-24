import fs from "node:fs";
import path from "node:path";
import { SceneError } from "@/Errors/SceneError.ts";
import { check, createFileReader, renderPng } from "@/render.ts";
import { BaseCommand } from "@/Commands/BaseCommand.ts";
import type { CommandArguments } from "@/Protocols/CommandProtocol.ts";

export abstract class SceneCommand extends BaseCommand {
  private static readonly CHARS_PER_TOKEN = 3.6;

  private static readonly BYTES_PER_KB = 1024;

  readonly isFileRequired = true;

  protected abstract readonly shouldWrite: boolean;

  run(args: CommandArguments): number {
    const file = args.positionals[0];
    if (!file) {
      return BaseCommand.EXIT_INVALID;
    }
    try {
      return this.runScene(file, args);
    } catch (error) {
      if (error instanceof SceneError) {
        BaseCommand.print({ schemaVersion: BaseCommand.SCHEMA_VERSION, file, errors: error.errors });
        return BaseCommand.EXIT_INVALID;
      }
      throw error;
    }
  }

  private static round(value: number, digits = 1): number {
    return Number(value.toFixed(digits));
  }

  private runScene(file: string, args: CommandArguments): number {
    const source = fs.readFileSync(file, "utf8");
    const started = performance.now();
    const sceneFolder = path.dirname(path.resolve(file));
    const result = check(source, { files: createFileReader(sceneFolder) });
    const compiled = performance.now();
    const kindToPath: Record<string, string> = {};
    let pngKb: number | null = null;
    if (this.shouldWrite) {
      const base = args.output ?? path.join("out", path.basename(file).replace(/\.ya?ml$/, ""));
      fs.mkdirSync(path.dirname(base), { recursive: true });
      fs.writeFileSync(`${base}.svg`, result.svg);
      kindToPath.svg = `${base}.svg`;
      if (args.shouldWritePng) {
        const raster = renderPng(result.svg, args.width);
        fs.writeFileSync(`${base}.png`, raster.png);
        kindToPath.png = `${base}.png`;
        pngKb = SceneCommand.round(raster.png.length / SceneCommand.BYTES_PER_KB);
      }
    }
    const done = performance.now();
    BaseCommand.print({
      schemaVersion: BaseCommand.SCHEMA_VERSION,
      file,
      written: kindToPath,
      warnings: result.warnings,
      art: result.art,
      description: result.description.split("\n"),
      stats: {
        sceneTokensApprox: Math.round(source.length / SceneCommand.CHARS_PER_TOKEN),
        svgTokensApprox: Math.round(result.svg.length / SceneCommand.CHARS_PER_TOKEN),
        compileMs: SceneCommand.round(compiled - started),
        renderMs: SceneCommand.round(done - compiled),
        svgKb: SceneCommand.round(result.svg.length / SceneCommand.BYTES_PER_KB),
        pngKb,
      },
    });
    return result.warnings.length + result.art.length > 0 ? BaseCommand.EXIT_FINDINGS : BaseCommand.EXIT_OK;
  }
}
