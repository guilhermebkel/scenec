import { IdUtil } from "@/Utils/IdUtil.ts";
import type { Camera, CompilationContext, Placement } from "@/Protocols/CompilationProtocol.ts";

export class FramingCheckService {
  private static readonly OUTSIDE_TOLERANCE = 0.05;

  private static readonly SLIVER_THRESHOLD = 0.18;

  private static readonly OVERLAP_THRESHOLD = 0.2;

  private static readonly PERCENT = 100;

  private static readonly BLOCKING_KINDS = ["ground", "any"] as const;

  static check(
    list: Placement[], context: CompilationContext, camera: Camera, heldToHolder: Record<string, string>,
  ): void {
    FramingCheckService.checkFrame(list, context, camera);
    FramingCheckService.checkOverlaps(list, context, heldToHolder);
  }

  private static percent(fraction: number): number {
    return Math.round(fraction * FramingCheckService.PERCENT);
  }

  private static checkFrame(list: Placement[], context: CompilationContext, camera: Camera): void {
    const { idToObject: objects, warnings, width, height, canvas } = context;
    for (const placement of list) {
      if (placement.isBackdrop) {
        continue;
      }
      const isCropAllowed = Boolean(objects[placement.id]?.allow_crop);
      if (camera.zoom > 1) {
        const shot = canvas.shot ?? "wide";
        FramingCheckService.checkZoomedPlacement(placement, { isCropAllowed, shot, warnings, width, height });
        continue;
      }
      const outsideX = Math.max(0, -placement.boxLeft, placement.boxRight - width) / placement.width;
      const outsideY = Math.max(0, -placement.boxTop) / placement.height;
      const worst = Math.max(outsideX, outsideY);
      if (worst > FramingCheckService.OUTSIDE_TOLERANCE && !isCropAllowed) {
        warnings.push(`'${placement.id}' is ${FramingCheckService.percent(worst)}% outside the frame`);
      }
    }
  }

  private static checkZoomedPlacement(
    placement: Placement,
    frame: { isCropAllowed: boolean; shot: string; warnings: string[]; width: number; height: number },
  ): void {
    const { isCropAllowed, shot, warnings, width, height } = frame;
    if (placement.isFocus && placement.isOffView) {
      warnings.push(
        `'${placement.id}' is the focus but fell outside the framing (shot: ${shot}); change frame or focus`,
      );
    }
    // Why: an object cut by the edge that shows very little becomes visual noise.
    const visibleWidth = Math.max(0, Math.min(width, placement.boxRight) - Math.max(0, placement.boxLeft));
    const visibleHeight = Math.max(0, Math.min(height, placement.boxBottom) - Math.max(0, placement.boxTop));
    const visible = (visibleWidth * visibleHeight) / Math.max(1, placement.width * placement.height);
    const isSliver = visible > 0 && visible < FramingCheckService.SLIVER_THRESHOLD;
    if (!placement.isOffView && isSliver && !isCropAllowed) {
      const shown = FramingCheckService.percent(visible);
      warnings.push(
        `'${placement.id}' shows only a sliver (${shown}%) at the edge of the framing; remove it, move it or show more of it`,
      );
    }
  }

  private static overlapFraction(first: Placement, second: Placement): number {
    const overlapX = Math.max(0, Math.min(first.boxRight, second.boxRight) - Math.max(first.boxLeft, second.boxLeft));
    const overlapY = Math.max(0, Math.min(first.boxBottom, second.boxBottom) - Math.max(first.boxTop, second.boxTop));
    return (overlapX * overlapY) / Math.min(first.width * first.height, second.width * second.height);
  }

  private static isOverlapIgnored(first: Placement, second: Placement, context: CompilationContext): boolean {
    const { idToObject: objects } = context;
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

  private static checkOverlaps(
    list: Placement[], context: CompilationContext, heldToHolder: Record<string, string>,
  ): void {
    const blocking = list.filter((placement) => (
      IdUtil.isOneOf(FramingCheckService.BLOCKING_KINDS, placement.kind)
      && !context.idToObject[placement.id]?.on
      && !heldToHolder[placement.id]
    ));
    for (let first = 0; first < blocking.length; first++) {
      for (let second = first + 1; second < blocking.length; second++) {
        const left = blocking[first];
        const right = blocking[second];
        if (!left || !right) {
          continue;
        }
        if (left.depth !== right.depth || FramingCheckService.isOverlapIgnored(left, right, context)) {
          continue;
        }
        const fraction = FramingCheckService.overlapFraction(left, right);
        if (fraction > FramingCheckService.OVERLAP_THRESHOLD) {
          const overlap = FramingCheckService.percent(fraction);
          context.warnings.push(
            `'${left.id}' overlaps '${right.id}' by ${overlap}%; use left_of/right_of or a different depth`,
          );
        }
      }
    }
  }
}
