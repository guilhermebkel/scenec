import { CompileService } from "@/pipeline/CompileService.ts";
import { ParseService } from "@/pipeline/ParseService.ts";
import type { ParsedScene } from "@/pipeline/ParseService.ts";
import type { CompileOptions } from "@/protocols/options.ts";
import type { CompileResult } from "@/protocols/result.ts";

export { SceneError } from "@/pipeline/SceneError.ts";
export type { ParsedScene, CompileResult };
export type { LayoutEntry } from "@/protocols/result.ts";
export type { Scene } from "@/protocols/scene.ts";
export type { BBox, CompileOptions, FileReader } from "@/protocols/options.ts";

export function compile(input: unknown, options: CompileOptions = {}): CompileResult {
  return CompileService.compile(input, options);
}

export function parseScene(input: unknown): ParsedScene {
  return ParseService.parseScene(input);
}
