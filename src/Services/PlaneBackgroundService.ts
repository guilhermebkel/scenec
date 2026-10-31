import type { PlaneCamera, PlaneWorld, ScreenPoint } from "@/Protocols/PlaneProtocol.ts";
import type { FloorOptions, WallsOptions } from "@/Protocols/SceneProtocol.ts";
import { GroundDetailService } from "@/Services/GroundDetailService.ts";
import { PlaneBoxService } from "@/Services/PlaneBoxService.ts";
import { RidgeService } from "@/Services/RidgeService.ts";
import { SkyDetailService } from "@/Services/SkyDetailService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";
import { ThemeUtil } from "@/Utils/ThemeUtil.ts";

type Span = readonly [number, number];

type Projector = PlaneCamera["project"];

type Quad = readonly [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint];

interface WallShape {
  groundZ: number;
  heightSpan: Span;
  fill: string;
}

interface SideShape {
  zSpan: Span;
  heightSpan: Span;
  fill: string;
}

interface RoomFloor {
  xSpan: Span;
  nearZ: number;
  backZ: number;
  floorColor: string;
  plankWidth: number;
}

interface Background {
  defs: string;
  svg: string;
}

export class PlaneBackgroundService {
  private static readonly DEFAULT_HORIZON_Z = 1.45;

  private static readonly HEX_RADIX = 16;

  private static readonly DEFAULT_SHADOW = [0, 0, 0, 0.15];

  private static readonly NUMBER = /[\d.]+/g;

  private static readonly MIN_PLANK_WIDTH = 1e-4;

  private static readonly OFF_FRAME_MARGIN = 40;

  private static readonly JOINT_SPACING = 0.55;

  private static readonly DEFAULT_RIDGES = 2;

  private static readonly DEFAULT_SEED = 1;

  private static readonly PATH_TUFT_MARGIN = 30;

  static draw(world: PlaneWorld): Background {
    const { camera, scene } = world;
    const horizonZ = scene.canvas?.horizon_z ?? PlaneBackgroundService.DEFAULT_HORIZON_Z;
    const svg = camera.isRoom
      ? PlaneBackgroundService.room(world)
      : PlaneBackgroundService.outdoors(world, camera.screenY(horizonZ));
    return { defs: PlaneBackgroundService.defs(world), svg: svg + PlaneBackgroundService.zoneTints(world) };
  }

  private static defs(world: PlaneWorld): string {
    const { theme, camera, tints } = world;
    const shadowChannels = theme.shadow.match(PlaneBackgroundService.NUMBER) ?? PlaneBackgroundService.DEFAULT_SHADOW;
    const [red = 0, green = 0, blue = 0, alpha = 0.15] = shadowChannels.map(Number);
    const shadow = `rgb(${red},${green},${blue})`;
    let defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${SkyDetailService.skyGradientStops(theme)}</linearGradient>`
      + `<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ColorUtil.sh(theme.ground, 0.18)}"/><stop offset="1" stop-color="${theme.ground}"/></linearGradient>`;
    defs += `<radialGradient id="cshadow"><stop offset="0" stop-color="${shadow}" stop-opacity="${alpha * 1.5}"/><stop offset="0.55" stop-color="${shadow}" stop-opacity="${alpha * 1.1}"/><stop offset="1" stop-color="${shadow}" stop-opacity="0"/></radialGradient>`;
    const [airRed = 0, airGreen = 0, airBlue = 0] = [1, 3, 5].map((start) => {
      const channel = theme.skyBottom.slice(start, start + 2);
      return parseInt(channel, PlaneBackgroundService.HEX_RADIX) / 255;
    });
    camera.hazeSteps?.forEach((step, index) => {
      const keep = 1 - step.strength;
      defs += `<filter id="haze${index + 1}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${keep} 0 0 0 ${(airRed * step.strength).toFixed(3)} 0 ${keep} 0 0 ${(airGreen * step.strength).toFixed(3)} 0 0 ${keep} 0 ${(airBlue * step.strength).toFixed(3)} 0 0 0 1 0"/></filter>`;
    });
    tints.forEach((tint, index) => {
      defs += `<radialGradient id="zone${index}"><stop offset="0" stop-color="${tint.color}" stop-opacity="1"/><stop offset="0.62" stop-color="${tint.color}" stop-opacity="0.9"/><stop offset="1" stop-color="${tint.color}" stop-opacity="0"/></radialGradient>`;
    });
    return defs;
  }

  private static outdoors(world: PlaneWorld, horizonY: number): string {
    const { theme, camera, scene } = world;
    const { width, height } = camera;
    const num = FormatUtil.oneDecimal;
    const hill = ColorUtil.sh(theme.groundDark || theme.ground, 0.25);
    const ridges = RidgeService.draw({
      count: scene.canvas?.ridges ?? PlaneBackgroundService.DEFAULT_RIDGES,
      seed: scene.canvas?.seed ?? PlaneBackgroundService.DEFAULT_SEED,
      width,
      horizonY,
      groundColor: hill,
      airColor: theme.skyBottom,
      bottomY: height,
    });
    const groundDetail = GroundDetailService.draw({
      detail: scene.canvas?.ground_detail ?? "low",
      seed: scene.canvas?.seed ?? PlaneBackgroundService.DEFAULT_SEED,
      width,
      height,
      horizonY,
      theme,
      isPathBlocked: (posX, posY) => PlaneBackgroundService.isNearPath(world, posX, posY),
    });
    return `<rect width="${width}" height="${height}" fill="url(#sky)"/>`
      + ridges
      + `<path d="M0 ${num(horizonY + 2)} Q${width * 0.25} ${num(horizonY - height * 0.035)} ${width * 0.5} ${num(horizonY)} T${width} ${num(horizonY - height * 0.02)} L${width} ${height} L0 ${height} Z" fill="url(#ground)"/>`
      + groundDetail;
  }

  private static isNearPath(world: PlaneWorld, posX: number, posY: number): boolean {
    const points = world.scene.path?.points;
    if (!points || points.length === 0) {
      return false;
    }
    return points.some((point) => {
      const at = point.at;
      if (!at) {
        return false;
      }
      const [screenX, screenY] = world.camera.project(at[0], at[1]);
      const distance = Math.hypot(posX - screenX, posY - screenY);
      return distance < PlaneBackgroundService.PATH_TUFT_MARGIN;
    });
  }

  private static room(world: PlaneWorld): string {
    const { theme, camera, scene } = world;
    const walls: WallsOptions = scene.walls ?? {};
    const floor: FloorOptions = scene.floor ?? {};
    const project = camera.project;
    const backZ = walls.back?.z ?? 1;
    const rightX = walls.right === false ? 3 : (walls.right?.x ?? 1);
    const leftX = walls.left?.x ?? -3;
    const wallHeight = walls.height ?? 320;
    const nearZ = floor.from_z ?? -0.8;
    const rightWall = walls.right === false ? undefined : walls.right;
    const backColor = ThemeUtil.resolve(theme, walls.back?.color, theme.wall);
    const rightColor = ThemeUtil.resolve(theme, rightWall?.color, ColorUtil.sh(backColor, -0.07));
    const leftColor = ThemeUtil.resolve(theme, walls.left?.color, ColorUtil.sh(backColor, -0.04));
    const floorColor = ThemeUtil.resolve(theme, floor.color, theme.floor);
    const xSpan: Span = [leftX, rightX];
    const skirting: Span = [0, 4];
    const fullHeight: Span = [0, wallHeight];
    let svg = `<rect width="${camera.width}" height="${camera.height}" fill="${backColor}"/>`;
    svg += PlaneBackgroundService.floorPolygon(project, xSpan, [nearZ, backZ], floorColor);
    if (floor.planks !== false) {
      const plankWidth = floor.plank_width ?? 0.05;
      svg += PlaneBackgroundService.planks(world, { xSpan, nearZ, backZ, floorColor, plankWidth });
    }
    const backWall: WallShape = { groundZ: backZ, heightSpan: fullHeight, fill: backColor };
    const backSkirting: WallShape = { groundZ: backZ, heightSpan: skirting, fill: ColorUtil.sh(backColor, -0.08) };
    svg += PlaneBackgroundService.backPolygon(project, xSpan, backWall);
    svg += PlaneBackgroundService.backPolygon(project, xSpan, backSkirting);
    const zSpan: Span = [nearZ, backZ];
    if (rightX < 2) {
      const seamBottom = project(rightX, backZ, 0);
      const seamTop = project(rightX, backZ, wallHeight);
      const seam = SvgUtil.segment(seamBottom, seamTop);
      const rightWall: SideShape = { zSpan, heightSpan: fullHeight, fill: rightColor };
      const rightSkirting: SideShape = { zSpan, heightSpan: skirting, fill: ColorUtil.sh(rightColor, -0.08) };
      svg += PlaneBackgroundService.sidePolygon(project, rightX, rightWall);
      svg += PlaneBackgroundService.sidePolygon(project, rightX, rightSkirting);
      svg += `<path d="${seam}" stroke="${ColorUtil.sh(backColor, -0.12)}" stroke-width="1.2"/>`;
    }
    if (leftX > -2) {
      svg += PlaneBackgroundService.sidePolygon(project, leftX, { zSpan, heightSpan: fullHeight, fill: leftColor });
    }
    const margin = 0.012;
    for (const box of world.boxes.filter((candidate) => PlaneBoxService.castsFloorShadow(candidate))) {
      const xRange: Span = [box.x0 - margin, box.x1 + margin];
      svg += PlaneBackgroundService.floorPolygon(project, xRange, [box.z0 - margin, box.z1], theme.shadow);
    }
    return svg;
  }

  private static floorPolygon(project: Projector, xSpan: Span, zSpan: Span, fill: string): string {
    const [left, right] = xSpan;
    const [near, far] = zSpan;
    const corners: Quad = [project(left, near), project(right, near), project(right, far), project(left, far)];
    return SvgUtil.polygon(corners, fill);
  }

  private static backPolygon(project: Projector, xSpan: Span, shape: WallShape): string {
    const { groundZ, heightSpan, fill } = shape;
    return SvgUtil.polygon([
      project(xSpan[0], groundZ, heightSpan[0]), project(xSpan[1], groundZ, heightSpan[0]),
      project(xSpan[1], groundZ, heightSpan[1]), project(xSpan[0], groundZ, heightSpan[1]),
    ], fill);
  }

  private static sidePolygon(project: Projector, groundX: number, shape: SideShape): string {
    const { zSpan, heightSpan, fill } = shape;
    return SvgUtil.polygon([
      project(groundX, zSpan[0], heightSpan[0]), project(groundX, zSpan[1], heightSpan[0]),
      project(groundX, zSpan[1], heightSpan[1]), project(groundX, zSpan[0], heightSpan[1]),
    ], fill);
  }

  private static planks(world: PlaneWorld, room: RoomFloor): string {
    const { camera } = world;
    const { xSpan, nearZ, backZ, floorColor, plankWidth } = room;
    const project = camera.project;
    const margin = PlaneBackgroundService.OFF_FRAME_MARGIN;
    let svg = "";
    for (let plankX = xSpan[0], index = 0; plankX < xSpan[1]; plankX += plankWidth, index++) {
      const from = Math.max(plankX, xSpan[0]);
      const to = Math.min(plankX + plankWidth, xSpan[1]);
      if (to - from < PlaneBackgroundService.MIN_PLANK_WIDTH) {
        continue;
      }
      const edges = [project(from, nearZ)[0], project(to, nearZ)[0], project(from, backZ)[0]];
      if (Math.max(...edges) < -margin || Math.min(...edges) > camera.width + margin) {
        continue;
      }
      const grain = ColorUtil.sh(floorColor, ((index * 7) % 3) * 0.025 - 0.02);
      const seam = SvgUtil.segment(project(from, nearZ), project(from, backZ));
      svg += PlaneBackgroundService.floorPolygon(project, [from, to], [nearZ, backZ], grain)
        + `<path d="${seam}" stroke="${ColorUtil.sh(floorColor, -0.3)}" stroke-width="1" opacity="0.55"/>`;
      // Why: joints are thin strips because perfectly horizontal lines make the renderer fail.
      const spacing = PlaneBackgroundService.JOINT_SPACING;
      const firstJoint = nearZ + ((index * 0.37) % 0.5);
      for (let jointZ = firstJoint; jointZ < backZ; jointZ += spacing) {
        const start = project(from, jointZ);
        const end = project(to, jointZ);
        const half = Math.max(0.6, 1.2 * camera.shrink(jointZ)) / 2;
        const strip: Quad = [
          [start[0], start[1] - half], [end[0], end[1] - half], [end[0], end[1] + half], [start[0], start[1] + half],
        ];
        svg += SvgUtil.polygon(strip, ColorUtil.sh(floorColor, -0.3), "opacity=\"0.4\"");
      }
    }
    return svg;
  }

  private static zoneTints(world: PlaneWorld): string {
    const { camera, tints } = world;
    const num = FormatUtil.oneDecimal;
    return tints.map((tint, index) => {
      const centerX = camera.screenX(tint.x, tint.z);
      const centerY = camera.screenY(tint.z);
      const radiusX = tint.radius * camera.width * 0.98 * camera.spread(tint.z);
      const radiusY = (camera.screenY(tint.z - tint.radius) - camera.screenY(tint.z + tint.radius)) / 2;
      return `<ellipse cx="${num(centerX)}" cy="${num(centerY)}" rx="${num(radiusX)}" ry="${num(radiusY)}" fill="url(#zone${index})"/>`;
    }).join("");
  }
}
