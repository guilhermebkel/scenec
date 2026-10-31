import fs from "node:fs";
import path from "node:path";
import { SceneError } from "@/Errors/SceneError.ts";
import { best, createFileReader, renderPng } from "@/render.ts";
import { BaseCommand } from "@/Commands/BaseCommand.ts";
import type { CommandArguments } from "@/Protocols/CommandProtocol.ts";

export class BestCommand extends BaseCommand {
  private static readonly CHARS_PER_TOKEN = 3.6;

  private static readonly BYTES_PER_KB = 1024;

  readonly name = "best";

  readonly isFileRequired = true;

  private static round(value: number, digits = 1): number {
    return Number(value.toFixed(digits));
  }

  run(args: CommandArguments): number {
    const file = args.positionals[0];
    if (!file) {
      return BaseCommand.EXIT_INVALID;
    }
    try {
      return this.runBest(file, args);
    } catch (error) {
      if (error instanceof SceneError) {
        BaseCommand.print({ schemaVersion: BaseCommand.SCHEMA_VERSION, file, errors: error.errors });
        return BaseCommand.EXIT_INVALID;
      }
      throw error;
    }
  }

  private runBest(file: string, args: CommandArguments): number {
    const source = fs.readFileSync(file, "utf8");
    const started = performance.now();
    const sceneFolder = path.dirname(path.resolve(file));
    const result = best(source, { count: args.count, files: createFileReader(sceneFolder) });
    const compiled = performance.now();

    const base = args.output ?? path.join("out", path.basename(file).replace(/\.ya?ml$/, ""));
    fs.mkdirSync(path.dirname(base), { recursive: true });
    fs.writeFileSync(`${base}.svg`, result.svg);
    fs.writeFileSync(file, result.updatedSceneYaml);

    const kindToPath: Partial<Record<"svg" | "png" | "scene", string>> = {
      svg: `${base}.svg`,
      scene: file,
    };

    let pngKb: number | null = null;
    if (args.shouldWritePng) {
      const raster = renderPng(result.svg, args.width);
      fs.writeFileSync(`${base}.png`, raster.png);
      kindToPath.png = `${base}.png`;
      pngKb = BestCommand.round(raster.png.length / BestCommand.BYTES_PER_KB);
    }

    const done = performance.now();
    BaseCommand.print({
      schemaVersion: BaseCommand.SCHEMA_VERSION,
      file,
      winner: result.winner,
      written: kindToPath,
      warnings: result.warnings,
      art: result.art,
      description: result.description.split("\n"),
      stats: {
        sceneTokensApprox: Math.round(source.length / BestCommand.CHARS_PER_TOKEN),
        svgTokensApprox: Math.round(result.svg.length / BestCommand.CHARS_PER_TOKEN),
        compileMs: BestCommand.round(compiled - started),
        renderMs: BestCommand.round(done - compiled),
        svgKb: BestCommand.round(result.svg.length / BestCommand.BYTES_PER_KB),
        pngKb,
      },
    });
    return result.warnings.length + result.art.length > 0 ? BaseCommand.EXIT_FINDINGS : BaseCommand.EXIT_OK;
  }
}
