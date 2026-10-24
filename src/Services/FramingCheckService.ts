import type { Camera, CompilationContext, Placement } from "@/Protocols/CompilationProtocol.ts";

export class FramingCheckService {
  private static readonly OUTSIDE_TOLERANCE = 0.05;

  private static readonly SLIVER_THRESHOLD = 0.18;

  private static readonly OVERLAP_THRESHOLD = 0.2;

  private static readonly PERCENT = 100;

  static check(list: Placement[], context: CompilationContext, camera: Camera, heldBy: Record<string, string>): void {
    FramingCheckService.checkFrame(list, context, camera);
    FramingCheckService.checkOverlaps(list, context, heldBy);
  }

  private static percent(fraction: number): number {
    return Math.round(fraction * FramingCheckService.PERCENT);
  }

  private static checkFrame(list: Placement[], context: CompilationContext, camera: Camera): void {
    const { library, objects, warnings, width, height, canvas } = context;
    for (const placement of list) {
      if (placement.isBackdrop) {
        continue;
      }
      const allowCrop = Boolean(objects[placement.id]?.allow_crop);
      if (camera.zoom > 1) {
        FramingCheckService.checkZoomedPlacement(placement, { allowCrop, shot: canvas.shot ?? "wide", warnings, width, height });
        continue;
      }
      const outsideX = Math.max(0, -placement.boxLeft, placement.boxRight - width) / placement.width;
      const outsideY = Math.max(0, -placement.boxTop) / placement.height;
      const worst = Math.max(outsideX, outsideY);
      if (worst > FramingCheckService.OUTSIDE_TOLERANCE && !allowCrop) {
        warnings.push(`'${placement.id}' is ${FramingCheckService.percent(worst)}% outside the frame`);
      }
    }
  }

  private static checkZoomedPlacement(
    placement: Placement,
    frame: { allowCrop: boolean; shot: string; warnings: string[]; width: number; height: number },
  ): void {
    const { allowCrop, shot, warnings, width, height } = frame;
    if (placement.isFocus && placement.isOffView) {
      warnings.push(`'${placement.id}' is the focus but fell outside the framing (shot: ${shot}); change frame or focus`);
    }
    // Why: an object cut by the edge that shows very little becomes visual noise.
    const visibleWidth = Math.max(0, Math.min(width, placement.boxRight) - Math.max(0, placement.boxLeft));
    const visibleHeight = Math.max(0, Math.min(height, placement.boxBottom) - Math.max(0, placement.boxTop));
    const visible = (visibleWidth * visibleHeight) / Math.max(1, placement.width * placement.height);
    const isSliver = visible > 0 && visible < FramingCheckService.SLIVER_THRESHOLD;
    if (!placement.isOffView && isSliver && !allowCrop) {
      warnings.push(`'${placement.id}' shows only a sliver (${FramingCheckService.percent(visible)}%) at the edge of the framing; remove it, move it or show more of it`);
    }
  }

  private static overlapFraction(first: Placement, second: Placement): number {
    const overlapX = Math.max(0, Math.min(first.boxRight, second.boxRight) - Math.max(first.boxLeft, second.boxLeft));
    const overlapY = Math.max(0, Math.min(first.boxBottom, second.boxBottom) - Math.max(first.boxTop, second.boxTop));
    return (overlapX * overlapY) / Math.min(first.width * first.height, second.width * second.height);
  }

  private static isOverlapIgnored(first: Placement, second: Placement, context: CompilationContext): boolean {
    const { library, objects } = context;
    if (first.related.includes(second.id) || second.related.includes(first.id)) {
      return true;
    }
    // Why: tabletops and shelves leave the space under them free.
    if (first.isHollow || second.isHollow) {
      return true;
    }
    // Why: different layers are a deliberate choice, not a collision.
    return (objects[first.id]?.layer ?? "") !== (objects[second.id]?.layer ?? "");
  }

  private static checkOverlaps(list: Placement[], context: CompilationContext, heldBy: Record<string, string>): void {
    const blocking = list.filter((placement) => ["ground", "any"].includes(placement.kind) && !context.objects[placement.id]?.on && !heldBy[placement.id]);
    for (let first = 0; first < blocking.length; first++) {
      for (let second = first + 1; second < blocking.length; second++) {
        const left = blocking[first];
        const right = blocking[second];
        if (!left || !right || left.depth !== right.depth || FramingCheckService.isOverlapIgnored(left, right, context)) {
          continue;
        }
        const fraction = FramingCheckService.overlapFraction(left, right);
        if (fraction > FramingCheckService.OVERLAP_THRESHOLD) {
          context.warnings.push(`'${left.id}' overlaps '${right.id}' by ${FramingCheckService.percent(fraction)}%; use left_of/right_of or a different depth`);
        }
      }
    }
  }
}
