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

  private static readonly SHOT_TO_CONFIG: Record<string, ShotConfig> = {
    full: { fill: 0.55 },
    medium: { show: 0.62, top: 0.12 },
    close: { show: 0.3, top: 0.08 },
  };

  private static readonly FRAME_TO_FRACTION: Record<string, number> = { left: 1 / 3, center: 0.5, right: 2 / 3 };

  private static readonly MAX_ZOOM = 6;

  private static readonly FOCUS_WIDTH_FRACTION = 0.8;

  private static readonly PERSON_SIDE_PADDING = 0.5;

  private static readonly CENTERED_FOCUS_HEIGHT = 0.55;

  private static readonly OFF_VIEW_MARGIN = 0.02;

  static frame(placed: Record<string, Placement>, context: CompilationContext): Camera {
    const shot = context.canvas.shot ?? "wide";
    if (shot === "wide") {
      return CameraService.NEUTRAL;
    }
    const config = CameraService.SHOT_TO_CONFIG[shot];
    if (!config) {
      context.warnings.push(`shot '${shot}' is invalid; use wide, full, medium or close`);
      return CameraService.NEUTRAL;
    }
    const focused = CameraService.focusedPlacements(placed, context, config);
    if (focused.length === 0) {
      return CameraService.NEUTRAL;
    }
    const camera = CameraService.cameraFor(CameraService.boundsOf(focused), config, context);
    for (const placement of Object.values(placed)) {
      CameraService.transform(placement, camera, context);
    }
    for (const placement of focused) {
      placement.isFocus = true;
    }
    return camera;
  }

  private static focusIds(placed: Record<string, Placement>, context: CompilationContext): string[] {
    const requested = ([] as string[]).concat(context.canvas.focus ?? []);
    const ids: string[] = [];
    for (const focus of requested) {
      const matches = placed[focus] ? [focus] : Object.keys(placed).filter((key) => key.startsWith(`${focus}_`));
      if (matches.length === 0) {
        context.warnings.push(`focus '${focus}' does not exist in the scene`);
      }
      ids.push(...matches);
    }
    if (ids.length > 0) {
      return ids;
    }
    const people = Object.values(placed).filter((placement) => placement.asset === "person");
    if (people.length > 0) {
      return people.map((placement) => placement.id);
    }
    return Object.values(placed).filter((placement) => ["ground", "any"].includes(placement.kind)).map((placement) => placement.id);
  }

  private static focusedPlacements(placed: Record<string, Placement>, context: CompilationContext, config: ShotConfig): Placement[] {
    const focused = CameraService.focusIds(placed, context).flatMap((id) => placed[id] ?? []);
    // Why: medium and close frame people (head and torso), so the group's table must not decide the zoom.
    const hasPerson = focused.some((placement) => placement.asset === "person");
    return config.top != null && hasPerson ? focused.filter((placement) => placement.asset === "person") : focused;
  }

  private static boundsOf(focused: Placement[]): Bounds {
    // Why: open or raised arms extend past a person's box, so people get side padding.
    const padding = (placement: Placement): number => (placement.asset === "person" ? placement.width * CameraService.PERSON_SIDE_PADDING : 0);
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
    const zoom = Math.max(1, Math.min(CameraService.MAX_ZOOM, heightZoom, widthZoom));
    const target = typeof canvas.frame === "number" ? canvas.frame : CameraService.FRAME_TO_FRACTION[canvas.frame ?? "center"] ?? 0.5;
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
