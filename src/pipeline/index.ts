import type { CompileOptions } from "../protocols/options.ts";
import { compileInternal } from "./compile.ts";
import { parseScene } from "./parse.ts";

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
  const { scene, warnings } = parseScene(input);
  const { critiqueInput: _ignored, ...result } = compileInternal(scene, options);
  return { ...result, warnings: [...warnings, ...result.warnings] } as CompileResult;
}
