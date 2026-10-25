import type { PlaneBox, PlaneCamera, PlaneWorld, ScreenPoint } from "@/Protocols/PlaneProtocol.ts";
import type { BOX_FACES, BOX_FRONTS, BoxDetails, BoxOptions } from "@/Protocols/SceneProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";
import { ThemeUtil } from "@/Utils/ThemeUtil.ts";

type BoxFace = (typeof BOX_FACES)[number];

type BoxFront = (typeof BOX_FRONTS)[number];

type Quad = readonly [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint];

interface DetailTarget {
  face: Quad;
  depthZ: number;
}

interface DetailContext {
  corner: (across: number, up: number) => ScreenPoint;
  stroke: number;
  count: number;
  plinth: number;
  color: string;
  gap: string;
  metal: string;
  details: BoxDetails;
}

export class PlaneBoxService {
  private static readonly DEFAULT_HEIGHT = 40;

  private static readonly OVERLAP_MIN = 0.002;

  private static readonly OVERLAP_HEIGHT_MIN = 0.5;

  private static readonly FLOOR_SHADOW_ELEVATION = 8;

  private static readonly DEFAULT_PLINTH = 2;

  private static readonly DEFAULT_DOORS = 2;

  private static readonly FRONT_TO_DEFAULT_COUNT: Record<BoxFront, number> = { drawers: 4, doors: 2, open: 2 };

  private static readonly FACE_TO_VISIBLE: Record<BoxFace, (eyeX: number, box: PlaneBox) => boolean> = {
    front: () => true,
    left: (eyeX, box) => eyeX < box.x0,
    right: (eyeX, box) => eyeX > box.x1,
  };

  private static readonly FACE_TO_DEPTH: Record<BoxFace, (box: PlaneBox) => number> = {
    front: (box) => box.z0,
    left: (box) => (box.z0 + box.z1) / 2,
    right: (box) => (box.z0 + box.z1) / 2,
  };

  static read(world: PlaneWorld): void {
    const { warnings, theme } = world;
    for (const [id, options] of Object.entries(world.scene.boxes ?? {})) {
      if (options.from === undefined || options.to === undefined) {
        warnings.push(`box '${id}' needs from: [x, z] and to: [x, z]`);
        continue;
      }
      const x0 = Math.min(options.from[0], options.to[0]);
      const x1 = Math.max(options.from[0], options.to[0]);
      const z0 = Math.min(options.from[1], options.to[1]);
      const z1 = Math.max(options.from[1], options.to[1]);
      const height = options.height ?? PlaneBoxService.DEFAULT_HEIGHT;
      const elevation = options.elevation ?? (options.thickness ? height - options.thickness : 0);
      if (elevation >= height) {
        warnings.push(`box '${id}': elevation (${elevation}) must be less than height (${height})`);
        continue;
      }
      const color = ThemeUtil.resolve(theme, options.color, theme.wood);
      world.boxes.push({ id, x0, x1, z0, z1, elevation, height, options, color });
      world.pointIdToPosition.set(id, [(x0 + x1) / 2, (z0 + z1) / 2]);
    }
    PlaneBoxService.warnInterpenetration(world.boxes, warnings);
  }

  static castsFloorShadow(box: PlaneBox): boolean {
    return box.elevation < PlaneBoxService.FLOOR_SHADOW_ELEVATION && box.options.shadow !== false;
  }

  static draw(world: PlaneWorld, box: PlaneBox): string {
    const { options } = box;
    const faceToCorners = PlaneBoxService.faces(world.camera.project, box);
    const details = options.details ?? PlaneBoxService.frontDetails(options);
    const detailFace: BoxFace = details?.face ?? "front";
    let svg = PlaneBoxService.body(world, box, faceToCorners, detailFace);
    if (details && PlaneBoxService.FACE_TO_VISIBLE[detailFace](world.camera.eyeX, box)) {
      const depthZ = PlaneBoxService.FACE_TO_DEPTH[detailFace](box);
      svg += PlaneBoxService.drawDetails(world, box, details, { face: faceToCorners[detailFace], depthZ });
    }
    return `<g id="${box.id}"${options.opacity === undefined ? "" : ` opacity="${options.opacity}"`}>${svg}</g>`;
  }

  private static faces(project: PlaneCamera["project"], box: PlaneBox): Record<BoxFace, Quad> {
    const { x0, x1, z0, z1, elevation, height } = box;
    return {
      front: [project(x0, z0, elevation), project(x1, z0, elevation), project(x1, z0, height), project(x0, z0, height)],
      left: [project(x0, z1, elevation), project(x0, z0, elevation), project(x0, z0, height), project(x0, z1, height)],
      right: [project(x1, z0, elevation), project(x1, z1, elevation), project(x1, z1, height), project(x1, z0, height)],
    };
  }

  private static body(
    world: PlaneWorld, box: PlaneBox, faceToCorners: Record<BoxFace, Quad>, detailFace: BoxFace,
  ): string {
    const { camera, theme } = world;
    const project = camera.project;
    const { x0, x1, z0, z1, elevation, height, color, options } = box;
    const paint = (face: BoxFace, other: string): string => (face === detailFace ? color : other);
    const topColor = ThemeUtil.resolve(theme, options.top_color, ColorUtil.sh(color, 0.1));
    const sideColor = ColorUtil.sh(color, -0.12);
    let svg = "";
    if (elevation > 0 && project(x0, z1, elevation)[1] > project(x0, z0, elevation)[1]) {
      const underside: Quad = [
        project(x0, z0, elevation), project(x1, z0, elevation), project(x1, z1, elevation), project(x0, z1, elevation),
      ];
      svg += SvgUtil.polygon(underside, ColorUtil.sh(color, -0.32));
    }
    // Why: only the faces the camera can see are drawn, and the one that carries the doors or drawers gets the full color.
    if (camera.eyeX < x0) {
      svg += SvgUtil.polygon(faceToCorners.left, paint("left", sideColor));
    }
    if (camera.eyeX > x1) {
      svg += SvgUtil.polygon(faceToCorners.right, paint("right", sideColor));
    }
    const top: Quad = [
      project(x0, z0, height), project(x1, z0, height), project(x1, z1, height), project(x0, z1, height),
    ];
    if (top[3][1] < top[0][1] - 0.3) {
      svg += SvgUtil.polygon(top, topColor);
    }
    const frontColor = paint("front", ColorUtil.sh(color, -0.04));
    svg += SvgUtil.polygon(faceToCorners.front, frontColor);
    const edge = SvgUtil.segment(top[0], top[1]);
    return svg + `<path d="${edge}" stroke="${ColorUtil.sh(color, 0.3)}" stroke-width="1"/>`;
  }

  private static countOf(details: BoxDetails): number {
    if (details.count !== undefined && details.count !== 0) {
      return details.count;
    }
    return IdUtil.lookup(PlaneBoxService.FRONT_TO_DEFAULT_COUNT, details.type) ?? PlaneBoxService.DEFAULT_DOORS;
  }

  private static frontDetails(options: BoxOptions): BoxDetails | null {
    return options.front ? { type: options.front, count: options.count, face: "front" } : null;
  }

  private static warnInterpenetration(boxes: readonly PlaneBox[], warnings: string[]): void {
    boxes.forEach((first, index) => {
      for (const second of boxes.slice(index + 1)) {
        const acrossX = Math.min(first.x1, second.x1) - Math.max(first.x0, second.x0);
        const acrossZ = Math.min(first.z1, second.z1) - Math.max(first.z0, second.z0);
        const acrossHeight = Math.min(first.height, second.height) - Math.max(first.elevation, second.elevation);
        const isOverlapping = acrossX > PlaneBoxService.OVERLAP_MIN && acrossZ > PlaneBoxService.OVERLAP_MIN;
        if (isOverlapping && acrossHeight > PlaneBoxService.OVERLAP_HEIGHT_MIN) {
          warnings.push(`boxes '${first.id}' and '${second.id}' interpenetrate; adjust from/to or elevation`);
        }
      }
    });
  }

  private static drawDetails(world: PlaneWorld, box: PlaneBox, details: BoxDetails, target: DetailTarget): string {
    const { camera, theme } = world;
    const { color, height, elevation } = box;
    const { face, depthZ } = target;
    const [bottomLeft, bottomRight, topRight, topLeft] = face;
    const corner = (across: number, up: number): ScreenPoint => {
      const bottomX = bottomLeft[0] + (bottomRight[0] - bottomLeft[0]) * across;
      const bottomY = bottomLeft[1] + (bottomRight[1] - bottomLeft[1]) * across;
      const topX = topLeft[0] + (topRight[0] - topLeft[0]) * across;
      const topY = topLeft[1] + (topRight[1] - topLeft[1]) * across;
      return [bottomX + (topX - bottomX) * up, bottomY + (topY - bottomY) * up];
    };
    const stroke = Math.max(0.7, camera.unit * camera.shrink(depthZ) * 0.16);
    const plinth = (details.plinth ?? PlaneBoxService.DEFAULT_PLINTH) / (height - elevation);
    const context: DetailContext = {
      corner, stroke, plinth, color, details,
      count: PlaneBoxService.countOf(details),
      gap: ColorUtil.sh(color, -0.3),
      metal: ThemeUtil.resolve(theme, details.handle, theme.metal),
    };
    const base = plinth > 0
      ? SvgUtil.polygon([corner(0, 0), corner(1, 0), corner(1, plinth), corner(0, plinth)], ColorUtil.sh(color, -0.28))
      : "";
    return details.type === undefined ? base : base + PlaneBoxService.FRONT_TO_DETAIL[details.type](context);
  }

  private static readonly line = (from: ScreenPoint, to: ScreenPoint, color: string, width: number): string =>
    `<path d="${SvgUtil.segment(from, to)}" stroke="${color}" stroke-width="${FormatUtil.oneDecimal(width)}" stroke-linecap="round"/>`;

  private static readonly drawers = (context: DetailContext): string => {
    const { corner, stroke, count, plinth, gap, metal } = context;
    const line = PlaneBoxService.line;
    let svg = "";
    for (let index = 0; index < count; index++) {
      const top = 1 - index * (1 - plinth) / count;
      const bottom = top - (1 - plinth) / count;
      const middle = (bottom + top) / 2 + (top - bottom) * 0.08;
      if (index > 0) {
        svg += line(corner(0.02, top), corner(0.98, top), gap, stroke);
      }
      const shade = middle - (top - bottom) * 0.06;
      svg += line(corner(0.28, middle), corner(0.72, middle), metal, stroke * 1.8)
        + line(corner(0.28, shade), corner(0.72, shade), ColorUtil.sh(metal, -0.35), stroke * 0.6);
    }
    return svg;
  };

  private static readonly doors = (context: DetailContext): string => {
    const { corner, stroke, count, plinth, gap, metal } = context;
    const line = PlaneBoxService.line;
    let svg = "";
    for (let index = 1; index < count; index++) {
      svg += line(corner(index / count, plinth), corner(index / count, 0.99), gap, stroke);
    }
    for (let index = 0; index < count; index++) {
      const across = PlaneBoxService.handleAcross(index, count);
      svg += line(corner(across, 0.42), corner(across, 0.74), metal, stroke * 1.8);
    }
    return svg;
  };

  private static readonly open = (context: DetailContext): string => {
    const { corner, stroke, plinth, color, details } = context;
    const inside = [corner(0.05, plinth + 0.04), corner(0.95, plinth + 0.04), corner(0.95, 0.95), corner(0.05, 0.95)];
    let svg = SvgUtil.polygon(inside, ColorUtil.sh(color, -0.38));
    for (const shelf of details.shelves ?? [0.5]) {
      svg += PlaneBoxService.line(corner(0.05, shelf), corner(0.95, shelf), color, stroke * 2.2);
    }
    return svg;
  };

  private static handleAcross(index: number, count: number): number {
    if (count === 1) {
      return 0.88;
    }
    return index < count / 2 ? (index + 1) / count - 0.045 : index / count + 0.045;
  }

  private static readonly FRONT_TO_DETAIL: Record<BoxFront, (context: DetailContext) => string> = {
    drawers: PlaneBoxService.drawers, doors: PlaneBoxService.doors, open: PlaneBoxService.open,
  };
}
