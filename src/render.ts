import { CheckModule } from "@/Modules/CheckModule.ts";
import type { CheckResult } from "@/Modules/CheckModule.ts";
import { FileReaderAdapter } from "@/Adapters/FileReaderAdapter.ts";
import { ResvgAdapter } from "@/Adapters/ResvgAdapter.ts";
import type { Raster } from "@/Adapters/ResvgAdapter.ts";
import type { BBox, CompileOptions, FileReader } from "@/Protocols/OptionsProtocol.ts";

export type { CheckResult, Raster };

export function check(input: unknown, options: CompileOptions = {}): CheckResult {
  return CheckModule.check(input, options);
}

export function createFileReader(folder: string): FileReader {
  return FileReaderAdapter.createFileReader(folder);
}

export function measureSvg(svg: string): BBox | null {
  return ResvgAdapter.measureSvg(svg);
}

export function renderPng(svg: string, width = 1200): Raster {
  return ResvgAdapter.renderPng(svg, width);
}
