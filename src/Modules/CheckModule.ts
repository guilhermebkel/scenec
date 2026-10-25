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
    const measure = (svg: string): ReturnType<typeof ResvgAdapter.measureSvg> => ResvgAdapter.measureSvg(svg);
    const { result, critique } = CompilationModule.compileInternal(scene, { measure, ...options });
    const art = critique ? CritiqueModule.critique(critique) : [];
    return { ...result, warnings: [...warnings, ...result.warnings], art };
  }
}
