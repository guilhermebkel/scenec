import { ResvgAdapter } from "@/render/ResvgAdapter.ts";
import { CriticService } from "@/render/CriticService.ts";
import { ParseService } from "@/pipeline/ParseService.ts";
import { CompileService } from "@/pipeline/CompileService.ts";
import type { CompileOptions } from "@/protocols/options.ts";
import type { CompileResult } from "@/protocols/result.ts";

export interface CheckResult extends CompileResult {
  art: string[];
}
export class CheckService {
  static check(input: unknown, options: CompileOptions = {}): CheckResult {
    const { scene, warnings } = ParseService.parseScene(input);
    const { critiqueInput, ...result } = CompileService.compileInternal(scene, { measure: (svg) => ResvgAdapter.measureSvg(svg), ...options });
    const art: string[] = critiqueInput ? CriticService.critique(critiqueInput) : [];
    return { ...result, warnings: [...warnings, ...result.warnings], art } as CheckResult;
  }
}
