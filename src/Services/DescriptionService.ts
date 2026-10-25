import type { CompilationContext, Placement } from "@/Protocols/CompilationProtocol.ts";
import type { LayoutEntry } from "@/Protocols/ResultProtocol.ts";

export class DescriptionService {
  private static readonly PERCENT = 100;

  private static percentOf(value: number, total: number): number {
    return Math.round((value / total) * DescriptionService.PERCENT);
  }

  private static roundedPercentOf(value: number, total: number): number {
    return Number(((value / total) * DescriptionService.PERCENT).toFixed(1));
  }

  static describe(ordered: Placement[], context: CompilationContext): string {
    const { width, height } = context;
    return ordered.map((placement) => `${placement.id} (${placement.asset}): x=${DescriptionService.percentOf(placement.x, width)}%, base=${DescriptionService.percentOf(placement.y, height)}%, `
      + `${DescriptionService.percentOf(placement.width, width)}%×${DescriptionService.percentOf(placement.height, height)}% of the frame${placement.depth ? `, ${placement.depth}` : ""}`).join("\n");
  }

  static layout(ordered: Placement[], context: CompilationContext): LayoutEntry[] {
    const { width, height } = context;
    return ordered.map((placement) => ({
      id: placement.id,
      asset: placement.asset,
      x: DescriptionService.roundedPercentOf(placement.x, width),
      base: DescriptionService.roundedPercentOf(placement.y, height),
      w: DescriptionService.roundedPercentOf(placement.width, width),
      h: DescriptionService.roundedPercentOf(placement.height, height),
    }));
  }
}
