import type { CritiqueInput, CritiqueObject, Depth } from "@/Protocols/CompilationProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";

export class ScaleCritiqueService {
  // Why: when the largest and smallest objects differ by less than 1.5x in height, visual hierarchy is flat and stagnant.
  private static readonly MIN_SCALE_RATIO = 1.5;

  // Why: scale variety requires at least 3 objects to establish a meaningful visual hierarchy.
  private static readonly MIN_SCALE_OBJECT_COUNT = 3;

  // Why: depth layer critique only applies when there are more than three objects to distribute across planes.
  private static readonly MIN_DEPTH_OBJECT_COUNT = 3;

  private static readonly NON_MEANINGFUL_KINDS = ["floor", "sky", "ceiling"] as const;

  private static readonly DEPTH_TO_OTHER_DEPTHS: Record<Depth, string> = {
    mid: "'near' or 'far'",
    near: "'mid' or 'far'",
    far: "'near' or 'mid'",
  };

  static critique(input: CritiqueInput): string[] {
    const meaningful = input.objects.filter(
      (object) => !object.isIgnored
        && !IdUtil.isOneOf(ScaleCritiqueService.NON_MEANINGFUL_KINDS, object.kind)
        && (object.height ?? 0) > 0,
    );
    return [
      ...ScaleCritiqueService.checkScale(meaningful),
      ...ScaleCritiqueService.checkDepth(meaningful, input.setting),
    ];
  }

  private static checkScale(objects: readonly CritiqueObject[]): string[] {
    if (objects.length < ScaleCritiqueService.MIN_SCALE_OBJECT_COUNT) {
      return [];
    }
    const heights = objects.map((object) => object.height ?? 0);
    const maxHeight = Math.max(...heights);
    const minHeight = Math.min(...heights);
    if (minHeight > 0 && maxHeight / minHeight < ScaleCritiqueService.MIN_SCALE_RATIO) {
      return ["objects have similar sizes; make the focus larger or add a small object for scale"];
    }
    return [];
  }

  private static checkDepth(objects: readonly CritiqueObject[], setting?: string): string[] {
    if (setting !== "outdoor" || objects.length <= ScaleCritiqueService.MIN_DEPTH_OBJECT_COUNT) {
      return [];
    }
    const depths = objects.map((object) => object.depth).filter((depth): depth is Depth => depth != null);
    if (depths.length === 0) {
      return [];
    }
    const uniqueDepths = [...new Set(depths)];
    if (uniqueDepths.length === 1) {
      const singleDepth = uniqueDepths[0];
      if (singleDepth) {
        const suggestion = IdUtil.lookup(ScaleCritiqueService.DEPTH_TO_OTHER_DEPTHS, singleDepth) ?? "'near' or 'far'";
        return [`everything is at depth '${singleDepth}'; move something to ${suggestion}`];
      }
    }
    return [];
  }
}
