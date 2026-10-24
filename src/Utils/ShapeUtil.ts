import type { Facing } from "@/Protocols/AssetProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export interface RectStyle {
  rx?: number;
  extra?: string;
}

export interface EllipsePaint {
  fill: string;
  extra?: string;
}

export class ShapeUtil {
  private static readonly ROUNDING_FACTOR = 100;

  private static readonly HALF_TURN_DEGREES = 180;

  private static readonly DEFAULT_SHADOW_RADIUS_Y = 3.5;

  static round(value: number): number {
    return Math.round(value * ShapeUtil.ROUNDING_FACTOR) / ShapeUtil.ROUNDING_FACTOR;
  }

  static toRadians(degrees: number): number {
    return (degrees * Math.PI) / ShapeUtil.HALF_TURN_DEGREES;
  }

  static circle(centerX: number, centerY: number, radius: number, fill: string, extra = ""): string {
    const cx = ShapeUtil.round(centerX);
    const cy = ShapeUtil.round(centerY);
    return `<circle cx="${cx}" cy="${cy}" r="${ShapeUtil.round(radius)}" fill="${fill}" ${extra}/>`;
  }

  static rect(posX: number, posY: number, width: number, height: number, fill: string, style: RectStyle = {}): string {
    const { rx = 0, extra = "" } = style;
    const x = ShapeUtil.round(posX);
    const y = ShapeUtil.round(posY);
    const attributes = `width="${ShapeUtil.round(width)}" height="${ShapeUtil.round(height)}" rx="${rx}" fill="${fill}"`;
    return `<rect x="${x}" y="${y}" ${attributes} ${extra}/>`;
  }

  static ellipse(centerX: number, centerY: number, radiusX: number, radiusY: number, paint: string | EllipsePaint): string {
    const { fill, extra = "" } = typeof paint === "string" ? { fill: paint } : paint;
    const cx = ShapeUtil.round(centerX);
    const cy = ShapeUtil.round(centerY);
    const radii = `rx="${ShapeUtil.round(radiusX)}" ry="${ShapeUtil.round(radiusY)}"`;
    return `<ellipse cx="${cx}" cy="${cy}" ${radii} fill="${fill}" ${extra}/>`;
  }

  static shadow(theme: Theme, radiusX: number, radiusY = ShapeUtil.DEFAULT_SHADOW_RADIUS_Y): string {
    return ShapeUtil.ellipse(0, 0, radiusX, radiusY, theme.shadow);
  }

  static directionOf(facing: Facing | undefined): 1 | -1 {
    const facingToDirection: Record<Facing, 1 | -1> = { left: -1, right: 1 };
    return facingToDirection[facing ?? "right"];
  }

  static color(theme: Theme, value: string | undefined, fallback: string): string {
    const themed = value === undefined ? undefined : theme[value];
    if (typeof themed === "string" && themed !== "") {
      return themed;
    }
    return value === undefined || value === "" ? fallback : value;
  }
}
