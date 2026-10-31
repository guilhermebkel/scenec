import type { Facing } from "@/Protocols/AssetProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { SeedUtil } from "@/Utils/SeedUtil.ts";

export interface RectStyle {
  rx?: number;
  extra?: string;
}

export type RectArguments = [
  posX: number, posY: number, width: number, height: number, fill: string, style?: RectStyle,
];

export interface EllipsePaint {
  fill: string;
  extra?: string;
}

export interface BlobOptions {
  lobes?: number;
  wobble?: number;
  seed?: number;
  squash?: number;
  fill?: string;
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

  static blob(centerX: number, centerY: number, radius: number, options: BlobOptions = {}): string {
    const { lobes = 5, wobble = 0.08, seed = 1, squash = 1, fill = "#000", extra = "" } = options;
    const random = SeedUtil.sequence(seed + lobes * 7919);
    const phaseA = random() * Math.PI * 2;
    const phaseB = random() * Math.PI * 2;
    const count = lobes * 4;
    const points: [number, number][] = [];
    for (let index = 0; index < count; index++) {
      const angle = (index / count) * Math.PI * 2;
      const wave = 0.65 * Math.sin(lobes * angle + phaseA) + 0.35 * Math.sin((lobes * 2 + 1) * angle + phaseB);
      const length = radius * (1 + wobble * wave);
      points.push([centerX + Math.cos(angle) * length * squash, centerY + Math.sin(angle) * length]);
    }
    const at = (index: number): [number, number] => points[(index + count) % count] ?? [centerX, centerY];
    const start = at(0);
    let path = `M${ShapeUtil.round(start[0])} ${ShapeUtil.round(start[1])}`;
    for (let index = 0; index < count; index++) {
      const [before, from, to, after] = [at(index - 1), at(index), at(index + 1), at(index + 2)];
      const c1 = [from[0] + (to[0] - before[0]) / 6, from[1] + (to[1] - before[1]) / 6];
      const c2 = [to[0] - (after[0] - from[0]) / 6, to[1] - (after[1] - from[1]) / 6];
      const parts = [c1[0], c1[1], c2[0], c2[1], to[0], to[1]].map((value) => ShapeUtil.round(value ?? 0));
      path += `C${parts.join(" ")}`;
    }
    return `<path d="${path}Z" fill="${fill}" ${extra}/>`;
  }

  static rect(...[posX, posY, width, height, fill, style = {}]: RectArguments): string {
    const { rx = 0, extra = "" } = style;
    const column = ShapeUtil.round(posX);
    const row = ShapeUtil.round(posY);
    const attributes = `width="${ShapeUtil.round(width)}" height="${ShapeUtil.round(height)}" rx="${rx}" fill="${fill}"`;
    return `<rect x="${column}" y="${row}" ${attributes} ${extra}/>`;
  }

  static ellipse(
    centerX: number, centerY: number, radiusX: number, radiusY: number, paint: string | EllipsePaint,
  ): string {
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
