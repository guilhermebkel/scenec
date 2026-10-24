import { ParseService } from "@/pipeline/ParseService.ts";
import type { ParsedScene } from "@/pipeline/ParseService.ts";
import { CompileService } from "@/pipeline/CompileService.ts";
import type { CompileOptions } from "@/protocols/options.ts";

export interface LayoutEntry {
  id: string;
  asset: string;
  x: number;
  base: number;
  w: number;
  h: number;
}

export interface CompileResult {
  svg: string;
  warnings: string[];
  description: string;
  layout?: LayoutEntry[];
}

export function compile(input: unknown, options: CompileOptions = {}): CompileResult {
  const { scene, warnings } = ParseService.parseScene(input);
  const { critiqueInput: _ignored, ...result } = CompileService.compileInternal(scene, options);
  return { ...result, warnings: [...warnings, ...result.warnings] } as CompileResult;
}

export function parseScene(input: unknown): ParsedScene {
  return ParseService.parseScene(input);
}
