import { CompilationModule } from "@/Modules/CompilationModule.ts";
import { ParsingModule } from "@/Modules/ParsingModule.ts";
import type { ParsedScene } from "@/Modules/ParsingModule.ts";
import type { CompileOptions } from "@/Protocols/OptionsProtocol.ts";
import type { CompileResult } from "@/Protocols/ResultProtocol.ts";

export { SceneError } from "@/Protocols/SceneError.ts";
export type { ParsedScene, CompileResult };
export type { LayoutEntry } from "@/Protocols/ResultProtocol.ts";
export type { Scene } from "@/Protocols/SceneProtocol.ts";
export type { BBox, CompileOptions, FileReader } from "@/Protocols/OptionsProtocol.ts";

export function compile(input: unknown, options: CompileOptions = {}): CompileResult {
  return CompilationModule.compile(input, options);
}

export function parseScene(input: unknown): ParsedScene {
  return ParsingModule.parseScene(input);
}
