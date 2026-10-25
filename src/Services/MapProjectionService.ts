import type { Box, Point, Projector, RouteStop } from "@/Protocols/MapProtocol.ts";
import type { MapOptions } from "@/Protocols/SceneProtocol.ts";

export class MapProjectionService {
  private static readonly DEFAULT_PADDING = 3.5;

  private static readonly LATITUDE_PADDING_SHARE = 0.8;

  private static readonly FRAME_STEPS = 10;

  private static readonly FIRST_PARALLEL = 43;

  private static readonly SECOND_PARALLEL = 62;

  private static readonly DEGREES_TO_RADIANS = Math.PI / 180;

  static fit(stops: readonly RouteStop[], options: MapOptions, area: Box): Projector {
    const count = stops.length || 1;
    const centerLon = options.center?.[0] ?? stops.reduce((sum, stop) => sum + stop.lon, 0) / count;
    const centerLat = options.center?.[1] ?? stops.reduce((sum, stop) => sum + stop.lat, 0) / count;
    const project = MapProjectionService.lambert(centerLon, centerLat);
    const padding = options.padding ?? MapProjectionService.DEFAULT_PADDING;
    const bounds = options.bounds ?? MapProjectionService.boundsOf(stops, padding);
    const frame = MapProjectionService.frameOf(bounds, project);
    const frameWidth = frame.x1 - frame.x0;
    const frameHeight = frame.y1 - frame.y0;
    const areaWidth = area.x1 - area.x0;
    const areaHeight = area.y1 - area.y0;
    const scale = Math.min(areaWidth / frameWidth, areaHeight / frameHeight);
    const offsetX = area.x0 + (areaWidth - frameWidth * scale) / 2 - frame.x0 * scale;
    const offsetY = area.y0 + (areaHeight - frameHeight * scale) / 2 - frame.y0 * scale;
    return (lon, lat) => {
      const [flatX, flatY] = project(lon, lat);
      return [offsetX + flatX * scale, offsetY + flatY * scale];
    };
  }

  private static boundsOf(stops: readonly RouteStop[], padding: number): [number, number, number, number] {
    const lons = stops.map((stop) => stop.lon);
    const lats = stops.map((stop) => stop.lat);
    const latPadding = padding * MapProjectionService.LATITUDE_PADDING_SHARE;
    return [
      Math.min(...lons) - padding, Math.max(...lons) + padding,
      Math.min(...lats) - latPadding, Math.max(...lats) + latPadding,
    ];
  }

  private static frameOf(bounds: readonly number[], project: Projector): Box {
    const [west = 0, east = 0, south = 0, north = 0] = bounds;
    const steps = MapProjectionService.FRAME_STEPS;
    const edge: Point[] = [];
    for (let step = 0; step <= steps; step++) {
      const lon = west + (east - west) * step / steps;
      const lat = south + (north - south) * step / steps;
      edge.push(project(lon, south), project(lon, north), project(west, lat), project(east, lat));
    }
    const xs = edge.map((point) => point[0]);
    const ys = edge.map((point) => point[1]);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }

  private static lambert(centerLon: number, centerLat: number): Projector {
    const radians = MapProjectionService.DEGREES_TO_RADIANS;
    const first = MapProjectionService.FIRST_PARALLEL;
    const second = MapProjectionService.SECOND_PARALLEL;
    const tangent = (parallel: number): number => Math.tan(Math.PI / 4 + (parallel * radians) / 2);
    const cone = Math.log(Math.cos(first * radians) / Math.cos(second * radians))
      / Math.log(tangent(second) / tangent(first));
    const factor = (Math.cos(first * radians) * tangent(first) ** cone) / cone;
    const radius = (parallel: number): number => factor / tangent(parallel) ** cone;
    const centerRadius = radius(centerLat);
    return (lon, lat) => {
      const theta = cone * (lon - centerLon) * radians;
      const pointRadius = radius(lat);
      return [pointRadius * Math.sin(theta), -(centerRadius - pointRadius * Math.cos(theta))];
    };
  }
}
