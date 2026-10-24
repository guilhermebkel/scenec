import type { CompileOptions } from "../protocols/options.ts";
import { compileInternal } from "../pipeline/compile.ts";
import type { CompileResult } from "../pipeline/index.ts";
import { parseScene } from "../pipeline/parse.ts";
import { critique } from "./critic.ts";
import { measureSvg } from "./png.ts";

export interface CheckResult extends CompileResult {
  art: string[];
}

export function check(input: unknown, options: CompileOptions = {}): CheckResult {
  const { scene, warnings } = parseScene(input);
  const { critiqueInput, ...result } = compileInternal(scene, { measure: measureSvg, ...options });
  const art: string[] = critiqueInput ? critique(critiqueInput) : [];
  return { ...result, warnings: [...warnings, ...result.warnings], art } as CheckResult;
}
