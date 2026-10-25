import type { Checkpoint, GroundPoint, PlaneWorld } from "@/Protocols/PlaneProtocol.ts";
import { PlanePathService } from "@/Services/PlanePathService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { RequireUtil } from "@/Utils/RequireUtil.ts";
import { ThemeUtil } from "@/Utils/ThemeUtil.ts";

const FONT = "Poppins";

export class PlaneRoadService {
  private static readonly DEFAULT_TILE_LENGTH = 0.045;

  private static readonly ROAD_EDGE = 0.006;

  private static readonly ROAD_SHADOW_DROP = 7;

  private static readonly CHECKPOINT_DEPTH = 6;

  private static readonly SAMPLE = "road sample";

  static draw(world: PlaneWorld): string {
    const { road, theme } = world;
    if (road.samples.length === 0 || !road.definition) {
      return "";
    }
    const roadColor = ThemeUtil.resolve(theme, road.definition.color, ColorUtil.sh(theme.paper, -0.04));
    const shadow = PlaneRoadService.outline(world, PlaneRoadService.ROAD_EDGE, PlaneRoadService.ROAD_SHADOW_DROP);
    const border = PlaneRoadService.outline(world, PlaneRoadService.ROAD_EDGE, 0);
    let svg = `<polygon points="${shadow}" fill="${ColorUtil.sh(theme.ground, -0.35)}" opacity="0.55"/>`;
    svg += `<polygon points="${border}" fill="${ColorUtil.sh(roadColor, -0.25)}"/>`
      + `<polygon points="${PlaneRoadService.outline(world, 0, 0)}" fill="${roadColor}"/>`;
    if (road.definition.tiles !== false) {
      svg += PlaneRoadService.tiles(world, road.definition.tile_length ?? PlaneRoadService.DEFAULT_TILE_LENGTH);
    }
    road.checkpoints.forEach((checkpoint, index) => {
      svg += PlaneRoadService.checkpoint(world, checkpoint, index);
    });
    return svg;
  }

  private static edge(world: PlaneWorld, sign: number, extra: number): GroundPoint[] {
    const { samples, width } = world.road;
    return samples.map((point, index) => {
      const before = RequireUtil.defined(samples[Math.max(0, index - 1)], PlaneRoadService.SAMPLE);
      const after = RequireUtil.defined(samples[Math.min(samples.length - 1, index + 1)], PlaneRoadService.SAMPLE);
      const tangentX = after[0] - before[0];
      const tangentZ = after[1] - before[1];
      const norm = Math.hypot(tangentX, tangentZ) || 1;
      const half = width / 2 + extra;
      return [point[0] - (tangentZ / norm) * half * sign, point[1] + (tangentX / norm) * half * sign];
    });
  }

  private static outline(world: PlaneWorld, extra: number, drop: number): string {
    const { screenX, screenY, shrink } = world.camera;
    const left = PlaneRoadService.edge(world, 1, extra);
    const right = PlaneRoadService.edge(world, -1, extra).reverse();
    return [...left, ...right].map(([groundX, groundZ]) => {
      const column = FormatUtil.oneDecimal(screenX(groundX, groundZ));
      return `${column},${FormatUtil.oneDecimal(screenY(groundZ) + drop * shrink(groundZ))}`;
    }).join(" ");
  }

  private static tiles(world: PlaneWorld, tileLength: number): string {
    const { road, theme, camera } = world;
    const total = RequireUtil.defined(road.arc.at(-1), "road length");
    const colors = [
      ColorUtil.sh(theme.accent, 0.55), ColorUtil.sh(theme.primary, 0.62), ColorUtil.sh(theme.secondary, 0.65),
    ];
    const half = road.width / 2 * 0.8;
    const clearance = road.checkpointRadius + tileLength * 0.45;
    let svg = "";
    let colorIndex = 0;
    for (let start = tileLength * 0.2; start < total - tileLength * 0.5; start += tileLength) {
      const end = start + tileLength * 0.8;
      if (road.checkpoints.some((checkpoint) => Math.abs(checkpoint.arc - (start + end) / 2) < clearance)) {
        colorIndex++;
        continue;
      }
      const first = PlanePathService.pointAt(road, start / total);
      const second = PlanePathService.pointAt(road, end / total);
      const corners = [[first, 1], [second, 1], [second, -1], [first, -1]] as const;
      const points = corners.map(([position, sign]) => {
        const groundX = position.point[0] + position.normal[0] * half * sign;
        const groundZ = position.point[1] + position.normal[1] * half * sign;
        const column = FormatUtil.oneDecimal(camera.screenX(groundX, groundZ));
        return `${column},${FormatUtil.oneDecimal(camera.screenY(groundZ))}`;
      }).join(" ");
      svg += `<polygon points="${points}" fill="${colors[colorIndex++ % colors.length]}"/>`;
    }
    return svg;
  }

  private static checkpoint(world: PlaneWorld, checkpoint: Checkpoint, index: number): string {
    const { camera, theme, road } = world;
    const num = FormatUtil.oneDecimal;
    const [groundX, groundZ] = checkpoint.at;
    const centerX = camera.screenX(groundX, groundZ);
    const centerY = camera.screenY(groundZ);
    const radiusX = road.checkpointRadius * camera.width * 0.98 * camera.spread(groundZ);
    const nearEdge = camera.screenY(groundZ - road.checkpointRadius);
    const radiusY = (nearEdge - camera.screenY(groundZ + road.checkpointRadius)) / 2;
    const color = checkpoint.isFinish ? theme.accent : ThemeUtil.resolve(theme, checkpoint.color, theme.primary);
    const shrink = camera.shrink(groundZ);
    const base = `cx="${num(centerX)}" cy="${num(centerY)}" rx="${num(radiusX)}" ry="${num(radiusY)}"`;
    const lowered = `cx="${num(centerX)}" cy="${num(centerY + PlaneRoadService.CHECKPOINT_DEPTH * shrink)}"`;
    let svg = `<ellipse ${lowered} rx="${num(radiusX)}" ry="${num(radiusY)}" fill="${ColorUtil.sh(color, -0.3)}"/>`
      + `<ellipse ${base} fill="${color}"/>`
      + `<ellipse cx="${num(centerX)}" cy="${num(centerY)}" rx="${num(radiusX * 0.78)}" ry="${num(radiusY * 0.78)}" `
      + `fill="none" stroke="${theme.paper}" stroke-width="${num(2.5 * shrink)}" opacity="0.8"/>`;
    if (!checkpoint.isOccupied) {
      svg += `<text x="${num(centerX)}" y="${num(centerY + radiusY * 0.35)}" font-family="${FONT}" font-weight="700" `
        + `font-size="${num(radiusY * 1.1)}" fill="${theme.paper}" text-anchor="middle">${checkpoint.isFinish ? "★" : index + 1}</text>`;
    }
    return svg;
  }
}
