import { CheckService } from "@/render/CheckService.ts";
import type { CheckResult } from "@/render/CheckService.ts";
import { FileReaderAdapter } from "@/render/FileReaderAdapter.ts";
import { ResvgAdapter } from "@/render/ResvgAdapter.ts";
import type { Raster } from "@/render/ResvgAdapter.ts";
import type { BBox, CompileOptions, FileReader } from "@/protocols/options.ts";

export type { CheckResult, Raster };

export function check(input: unknown, options: CompileOptions = {}): CheckResult {
  return CheckService.check(input, options);
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
