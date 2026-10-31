import type { CompilationContext, Placement, TextRect } from "@/Protocols/CompilationProtocol.ts";
import type { FramingElement } from "@/Protocols/SceneProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";

export type FramingCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface FramingResult {
  svg: string;
  kind: FramingElement;
  corner?: FramingCorner;
}

type CornerDrawer = (corner: FramingCorner, width: number, height: number, ink: string) => string;

export class FramingService {
  private static readonly BLUR_SIGMA = "3.2";

  private static readonly DEFAULT_FOCUS_X = 0.5;

  private static readonly INK_SHADE = -0.05;

  private static readonly CORNER_WIDTH_RATIO = 0.28;

  private static readonly CORNER_HEIGHT_RATIO = 0.32;

  private static readonly CURTAIN_HEIGHT_RATIO = 0.85;

  private static readonly CURTAIN_BOTTOM_RATIO = 0.95;

  private static readonly FRAME_LEFT_RATIO = 0.3;

  private static readonly FRAME_RIGHT_RATIO = 0.7;

  private static readonly TOP_KINDS: readonly FramingElement[] = ["foliage", "curtain"];

  private static readonly FRAME_TO_X_RATIO: Record<"left" | "right" | "center", number> = {
    left: FramingService.FRAME_LEFT_RATIO,
    center: FramingService.DEFAULT_FOCUS_X,
    right: FramingService.FRAME_RIGHT_RATIO,
  };

  private static readonly KIND_TO_DRAWER: Partial<Record<FramingElement, CornerDrawer>> = {
    foliage: (corner, width, height, ink) => FramingService.drawFoliage(corner, width, height, ink),
    curtain: (corner, width, height, ink) => FramingService.drawCurtain(corner, width, height, ink),
    plants: (corner, width, height, ink) => FramingService.drawPlants(corner, width, height, ink),
  };

  static render(
    context: CompilationContext,
    placements: readonly Placement[],
    textRects: readonly TextRect[],
  ): FramingResult {
    const rawKind = context.canvas.framing ?? context.canvas.frame_elements ?? "none";
    const drawer = IdUtil.lookup(FramingService.KIND_TO_DRAWER, rawKind);
    if (!drawer) {
      return { svg: "", kind: "none" };
    }
    const focusX = FramingService.resolveFocusX(context, placements);
    const isTopKind = IdUtil.isOneOf(FramingService.TOP_KINDS, rawKind);
    const isLeftPreferred = focusX > context.width * FramingService.DEFAULT_FOCUS_X;
    const corner = FramingService.selectCorner({
      isTopKind,
      isLeftPreferred,
      width: context.width,
      height: context.height,
      textRects,
    });
    const ink = ColorUtil.sh(context.theme.ink, FramingService.INK_SHADE);
    const filterDef = `<defs><filter id="frameBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${FramingService.BLUR_SIGMA}"/></filter></defs>`;
    const body = drawer(corner, context.width, context.height, ink);
    const svg = `${filterDef}<g id="frame-repoussoir" filter="url(#frameBlur)">${body}</g>`;
    return { svg, kind: rawKind, corner };
  }

  private static resolveFocusX(context: CompilationContext, placements: readonly Placement[]): number {
    const focusPlacement = placements.find((candidate) => candidate.isFocus);
    if (focusPlacement) {
      return focusPlacement.x;
    }
    const frame = context.canvas.frame;
    if (typeof frame === "number") {
      return frame * context.width;
    }
    const namedRatio = frame ? IdUtil.lookup(FramingService.FRAME_TO_X_RATIO, frame) : undefined;
    if (namedRatio != null) {
      return namedRatio * context.width;
    }
    return context.width * FramingService.DEFAULT_FOCUS_X;
  }

  private static selectCorner(parts: {
    isTopKind: boolean;
    isLeftPreferred: boolean;
    width: number;
    height: number;
    textRects: readonly TextRect[];
  }): FramingCorner {
    const { isTopKind, isLeftPreferred, width, height, textRects } = parts;
    const choose = (isLeft: boolean): FramingCorner => (
      isTopKind ? FramingService.chooseTopCorner(isLeft) : FramingService.chooseBottomCorner(isLeft)
    );
    const primary = choose(isLeftPreferred);
    const alternative = choose(!isLeftPreferred);
    if (!FramingService.collidesWithText(primary, width, height, textRects)) {
      return primary;
    }
    return alternative;
  }

  private static chooseTopCorner(isLeft: boolean): FramingCorner {
    return isLeft ? "top-left" : "top-right";
  }

  private static chooseBottomCorner(isLeft: boolean): FramingCorner {
    return isLeft ? "bottom-left" : "bottom-right";
  }

  private static collidesWithText(
    corner: FramingCorner,
    width: number,
    height: number,
    textRects: readonly TextRect[],
  ): boolean {
    const cornerWidth = width * FramingService.CORNER_WIDTH_RATIO;
    const cornerHeight = height * FramingService.CORNER_HEIGHT_RATIO;
    const box = {
      x0: corner.includes("left") ? 0 : width - cornerWidth,
      y0: corner.includes("top") ? 0 : height - cornerHeight,
      x1: corner.includes("left") ? cornerWidth : width,
      y1: corner.includes("top") ? cornerHeight : height,
    };
    return textRects.some((rect) => rect.x0 < box.x1 && rect.x1 > box.x0 && rect.y0 < box.y1 && rect.y1 > box.y0);
  }

  private static drawFoliage(corner: FramingCorner, width: number, height: number, ink: string): string {
    const isLeft = corner.includes("left");
    const flip = isLeft ? "" : ` transform="translate(${width} 0) scale(-1 1)"`;
    return `<g${flip} fill="${ink}">`
      + `<path d="M 0 0 Q 80 40 180 30 Q 140 100 90 120 Q 30 130 0 160 Z"/>`
      + `<path d="M 60 20 C 130 10 200 60 230 120 C 170 140 110 100 60 20 Z"/>`
      + `<path d="M 120 25 C 190 20 280 80 290 150 C 230 160 170 110 120 25 Z"/>`
      + `<path d="M 20 60 C 60 120 90 210 80 270 C 40 230 10 170 20 60 Z"/>`
      + `<path d="M 70 90 C 130 160 170 250 160 300 C 120 270 80 200 70 90 Z"/>`
      + "</g>";
  }

  private static drawCurtain(corner: FramingCorner, width: number, height: number, ink: string): string {
    const isLeft = corner.includes("left");
    const flip = isLeft ? "" : ` transform="translate(${width} 0) scale(-1 1)"`;
    const targetHeight = height * FramingService.CURTAIN_HEIGHT_RATIO;
    const bottomHeight = height * FramingService.CURTAIN_BOTTOM_RATIO;
    return `<g${flip} fill="${ink}" opacity="0.92">`
      + `<path d="M 0 0 L 160 0 C 140 100 130 200 110 320 C 90 440 60 ${targetHeight.toFixed(1)} 0 ${bottomHeight.toFixed(1)} Z"/>`
      + `<path d="M 40 0 C 35 120 25 240 15 360 C 10 420 5 480 0 540 L 0 0 Z" opacity="0.4"/>`
      + "</g>";
  }

  private static drawPlants(corner: FramingCorner, width: number, height: number, ink: string): string {
    const isLeft = corner.includes("left");
    const flip = isLeft
      ? ` transform="translate(0 ${height}) scale(1 -1)"`
      : ` transform="translate(${width} ${height}) scale(-1 -1)"`;
    return `<g${flip} fill="${ink}">`
      + `<path d="M 0 0 C 40 80 80 200 70 320 C 40 250 10 160 0 80 Z"/>`
      + `<path d="M 20 0 C 80 110 160 240 180 360 C 130 300 80 190 20 0 Z"/>`
      + `<path d="M 50 0 C 130 100 230 180 320 230 C 240 180 150 110 50 0 Z"/>`
      + `<path d="M 40 0 C 100 60 190 120 260 130 C 190 100 120 50 40 0 Z"/>`
      + "</g>";
  }
}
