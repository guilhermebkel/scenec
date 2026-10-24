import { ResvgAdapter } from "@/Adapters/ResvgAdapter.ts";
import { CritiqueModule } from "@/Modules/CritiqueModule.ts";
import { ParsingModule } from "@/Modules/ParsingModule.ts";
import { CompilationModule } from "@/Modules/CompilationModule.ts";
import type { CompileOptions } from "@/Protocols/OptionsProtocol.ts";
import type { CompileResult } from "@/Protocols/ResultProtocol.ts";

export interface CheckResult extends CompileResult {
  art: string[];
}
export class CheckModule {
  static check(input: unknown, options: CompileOptions = {}): CheckResult {
    const { scene, warnings } = ParsingModule.parseScene(input);
    const { critiqueInput, ...result } = CompilationModule.compileInternal(scene, { measure: (svg) => ResvgAdapter.measureSvg(svg), ...options });
    const art: string[] = critiqueInput ? CritiqueModule.critique(critiqueInput) : [];
    return { ...result, warnings: [...warnings, ...result.warnings], art } as CheckResult;
  }
}
