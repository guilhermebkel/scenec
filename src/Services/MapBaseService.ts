import type { MapCountry, MapFrame, Point, Projector, RouteStop } from "@/Protocols/MapProtocol.ts";
import type { MapOptions } from "@/Protocols/SceneProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { MapRouteService } from "@/Services/MapRouteService.ts";

interface Palette {
  sea: string;
  land: string;
}

export class MapBaseService {
  private static readonly DEFAULT_PALETTE = ["#9DB8F0", "#F7C98A", "#9ED39A", "#E9A0B4", "#B9A3E3", "#8FD3D1", "#F2A68F", "#D8C27A"] as const;

  private static readonly BORDER = "#FFFFFF";

  private static readonly OFF_FRAME_MARGIN = 50;

  private static readonly VISIBLE_MARGIN = 60;

  private static readonly WAVE_ROW_STEP = 46;

  private static readonly WAVE_COLUMN_STEP = 90;

  private static readonly WAVE_FIRST_ROW = 30;

  static paletteOf(frame: MapFrame): Palette {
    return { sea: ColorUtil.sh(frame.theme.glass, 0.25), land: ColorUtil.sh(frame.theme.paper, -0.05) };
  }

  static visitedCountries(stops: readonly RouteStop[], options: MapOptions): MapCountry[] {
    const visited: MapCountry[] = [];
    for (const stop of stops) {
      if (stop.country && !visited.includes(stop.country)) {
        visited.push(stop.country);
      }
    }
    for (const name of options.highlight ?? []) {
      const country = MapRouteService.countryNamed(name);
      if (country && !visited.includes(country)) {
        visited.push(country);
      }
    }
    return visited;
  }

  static countryColors(visited: readonly MapCountry[], options: MapOptions): Map<MapCountry, string> {
    const palette: readonly string[] = options.palette ?? MapBaseService.DEFAULT_PALETTE;
    return new Map(visited.map((country, index) => [country, palette[index % palette.length] ?? ""]));
  }

  static draw(frame: MapFrame, project: Projector, countryToColor: ReadonlyMap<MapCountry, string>): string {
    const { sea, land } = MapBaseService.paletteOf(frame);
    const pathOf = (polys: number[][][][]): string => MapBaseService.pathOf(polys, project, frame);
    const others = MapRouteService.COUNTRIES.filter((country) => !countryToColor.has(country));
    let svg = `<rect x="0" y="0" width="${frame.width}" height="${frame.height}" fill="${sea}"/>`;
    svg += MapBaseService.waves(frame, sea);
    svg += MapBaseService.graticule(frame, project);
    svg += `<g stroke="${MapBaseService.BORDER}" stroke-width="1" stroke-linejoin="round">`
      + others.map((country) => `<path d="${pathOf(country.polys)}" fill="${land}"/>`).join("") + "</g>";
    for (const [country, color] of countryToColor) {
      const outline = pathOf(country.polys);
      svg += `<path d="${outline}" fill="${ColorUtil.sh(color, -0.35)}" transform="translate(0 4)" opacity="0.55"/>`
        + `<path d="${outline}" fill="${color}" stroke="${ColorUtil.sh(color, -0.3)}" stroke-width="1.6" stroke-linejoin="round"/>`;
    }
    return svg;
  }

  private static waves(frame: MapFrame, sea: string): string {
    const stroke = ColorUtil.sh(sea, -0.1);
    let svg = "";
    for (let row = MapBaseService.WAVE_FIRST_ROW; row < frame.height; row += MapBaseService.WAVE_ROW_STEP) {
      const firstColumn = (row / MapBaseService.WAVE_ROW_STEP % 2) * 40 + 20;
      const lastColumn = frame.width - frame.panelWidth;
      for (let column = firstColumn; column < lastColumn; column += MapBaseService.WAVE_COLUMN_STEP) {
        svg += `<path d="M${column} ${row} q8 -4 16 0 t16 0" stroke="${stroke}" stroke-width="1.5" fill="none" opacity="0.5"/>`;
      }
    }
    return svg;
  }

  private static graticule(frame: MapFrame, project: Projector): string {
    let svg = "";
    for (let lon = -30; lon <= 50; lon += 5) {
      const line: Point[] = [];
      for (let lat = 30; lat <= 72; lat += 1) {
        line.push(project(lon, lat));
      }
      svg += MapBaseService.graticuleLine(line, frame);
    }
    for (let lat = 30; lat <= 72; lat += 5) {
      const line: Point[] = [];
      for (let lon = -30; lon <= 50; lon += 1) {
        line.push(project(lon, lat));
      }
      svg += MapBaseService.graticuleLine(line, frame);
    }
    return svg;
  }

  private static graticuleLine(line: readonly Point[], frame: MapFrame): string {
    const margin = MapBaseService.VISIBLE_MARGIN;
    const visible = line.filter(([screenX, screenY]) => screenX > -margin && screenX < frame.width + margin
      && screenY > -margin && screenY < frame.height + margin);
    if (visible.length < 2) {
      return "";
    }
    const points = visible.map((point) => point.map(FormatUtil.oneDecimal).join(" ")).join("L");
    return `<path d="M${points}" stroke="${frame.theme.paper}" stroke-width="0.8" fill="none" opacity="0.35"/>`;
  }

  private static pathOf(polys: number[][][][], project: Projector, frame: MapFrame): string {
    const margin = MapBaseService.OFF_FRAME_MARGIN;
    return polys.map((poly) => {
      const rings = poly.map((ring) => ring.map(([lon = 0, lat = 0]) => project(lon, lat)));
      const outer = rings[0] ?? [];
      const xs = outer.map((point) => point[0]);
      const ys = outer.map((point) => point[1]);
      const isOffFrame = Math.max(...xs) < -margin || Math.min(...xs) > frame.width + margin
        || Math.max(...ys) < -margin || Math.min(...ys) > frame.height + margin;
      if (isOffFrame) {
        return "";
      }
      return rings.map((ring) => `M${ring.map((point) => `${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join("L")}Z`).join("");
    }).join("");
  }
}
