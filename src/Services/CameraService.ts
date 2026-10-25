import type { ShotName } from "@/Protocols/SceneProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import type { Camera, CompilationContext, Placement } from "@/Protocols/CompilationProtocol.ts";

interface ShotConfig {
  fill?: number;
  show?: number;
  top?: number;
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class CameraService {
  static readonly NEUTRAL: Camera = { zoom: 1, translateX: 0, translateY: 0 };

  private static readonly SHOT_TO_CONFIG: Record<Exclude<ShotName, "wide">, ShotConfig> = {
    full: { fill: 0.55 },
    medium: { show: 0.62, top: 0.12 },
    close: { show: 0.3, top: 0.08 },
  };

  private static readonly LEFT_THIRD = 0.3333333333333333;

  private static readonly RIGHT_THIRD = 0.6666666666666666;

  private static readonly FOCUSABLE_KINDS = ["ground", "any"] as const;

  private static readonly FRAME_TO_FRACTION: Record<"left" | "center" | "right", number> = {
    left: CameraService.LEFT_THIRD, center: 0.5, right: CameraService.RIGHT_THIRD,
  };

  private static readonly MAX_ZOOM = 6;

  private static readonly FOCUS_WIDTH_FRACTION = 0.8;

  private static readonly PERSON_SIDE_PADDING = 0.5;

  private static readonly CENTERED_FOCUS_HEIGHT = 0.55;

  private static readonly OFF_VIEW_MARGIN = 0.02;

  static frame(idToPlacement: Record<string, Placement>, context: CompilationContext): Camera {
    const shot = context.canvas.shot ?? "wide";
    if (shot === "wide") {
      return CameraService.NEUTRAL;
    }
    const config = IdUtil.lookup(CameraService.SHOT_TO_CONFIG, shot);
    if (!config) {
      context.warnings.push(`shot '${shot}' is invalid; use wide, full, medium or close`);
      return CameraService.NEUTRAL;
    }
    const focused = CameraService.focusedPlacements(idToPlacement, context, config);
    if (focused.length === 0) {
      return CameraService.NEUTRAL;
    }
    const bounds = CameraService.boundsOf(focused);
    const camera = CameraService.cameraFor(bounds, config, context);
    for (const placement of Object.values(idToPlacement)) {
      CameraService.transform(placement, camera, context);
    }
    for (const placement of focused) {
      placement.isFocus = true;
    }
    return camera;
  }

  private static isPerson(placement: Placement): boolean {
    return placement.asset === "person";
  }

  private static focusIds(idToPlacement: Record<string, Placement>, context: CompilationContext): string[] {
    const requested = ([] as string[]).concat(context.canvas.focus ?? []);
    const ids: string[] = [];
    for (const focus of requested) {
      const matches = idToPlacement[focus]
        ? [focus]
        : Object.keys(idToPlacement).filter((key) => key.startsWith(`${focus}_`));
      if (matches.length === 0) {
        context.warnings.push(`focus '${focus}' does not exist in the scene`);
      }
      ids.push(...matches);
    }
    if (ids.length > 0) {
      return ids;
    }
    const all = Object.values(idToPlacement);
    const people = all.filter((placement) => CameraService.isPerson(placement));
    if (people.length > 0) {
      return people.map((placement) => placement.id);
    }
    return all.filter((placement) => IdUtil.isOneOf(CameraService.FOCUSABLE_KINDS, placement.kind))
      .map((placement) => placement.id);
  }

  private static focusedPlacements(
    idToPlacement: Record<string, Placement>, context: CompilationContext, config: ShotConfig,
  ): Placement[] {
    const focused = CameraService.focusIds(idToPlacement, context).flatMap((id) => idToPlacement[id] ?? []);
    // Why: medium and close frame people (head and torso), so the group's table must not decide the zoom.
    const hasPerson = focused.some((placement) => CameraService.isPerson(placement));
    return config.top != null && hasPerson ? focused.filter((placement) => CameraService.isPerson(placement)) : focused;
  }

  private static boundsOf(focused: Placement[]): Bounds {
    const padding = (placement: Placement): number => {
      // Why: open or raised arms extend past a person's box, so people get side padding.
      return CameraService.isPerson(placement) ? placement.width * CameraService.PERSON_SIDE_PADDING : 0;
    };
    return {
      left: Math.min(...focused.map((placement) => placement.boxLeft - padding(placement))),
      right: Math.max(...focused.map((placement) => placement.boxRight + padding(placement))),
      top: Math.min(...focused.map((placement) => placement.boxTop)),
      bottom: Math.max(...focused.map((placement) => placement.boxBottom)),
    };
  }

  private static cameraFor(bounds: Bounds, config: ShotConfig, context: CompilationContext): Camera {
    const { width, height, canvas } = context;
    const top = canvas.headroom ?? config.top;
    const focusHeight = Math.max(1, bounds.bottom - bounds.top);
    // Why: "full" fills a fixed share of the height; medium and close fit only the `show` share of the body below the headroom.
    const heightZoom = config.fill
      ? (config.fill * height) / focusHeight
      : ((1 - (top ?? 0)) * height) / ((config.show ?? 1) * focusHeight);
    const widthZoom = (CameraService.FOCUS_WIDTH_FRACTION * width) / Math.max(1, bounds.right - bounds.left);
    const limited = Math.min(CameraService.MAX_ZOOM, heightZoom, widthZoom);
    const zoom = Math.max(1, limited);
    const named = IdUtil.lookup(CameraService.FRAME_TO_FRACTION, canvas.frame ?? "center") ?? 0.5;
    const target = typeof canvas.frame === "number" ? canvas.frame : named;
    const translateX = target * width - ((bounds.left + bounds.right) / 2) * zoom;
    const translateY = top == null
      ? CameraService.CENTERED_FOCUS_HEIGHT * height - ((bounds.top + bounds.bottom) / 2) * zoom
      : top * height - bounds.top * zoom;
    return {
      zoom,
      translateX: Math.min(0, Math.max(width - width * zoom, translateX)),
      translateY: Math.min(0, Math.max(height - height * zoom, translateY)),
    };
  }

  private static transform(placement: Placement, camera: Camera, context: CompilationContext): void {
    const { zoom, translateX, translateY } = camera;
    const { width, height } = context;
    placement.x = placement.x * zoom + translateX;
    placement.y = placement.y * zoom + translateY;
    placement.scale *= zoom;
    placement.width *= zoom;
    placement.height *= zoom;
    placement.boxLeft = placement.boxLeft * zoom + translateX;
    placement.boxRight = placement.boxRight * zoom + translateX;
    placement.boxTop = placement.boxTop * zoom + translateY;
    placement.boxBottom = placement.boxBottom * zoom + translateY;
    const margin = CameraService.OFF_VIEW_MARGIN;
    placement.isOffView = placement.boxRight < -margin * width || placement.boxLeft > (1 + margin) * width
      || placement.boxBottom < -margin * height || placement.boxTop > (1 + margin) * height;
  }
}
