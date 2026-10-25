import type { MapFrame, MapLeg, MapStop } from "@/Protocols/MapProtocol.ts";
import type { CompileResult } from "@/Protocols/ResultProtocol.ts";
import type { Scene } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { MapBaseService } from "@/Services/MapBaseService.ts";
import { MapLabelService } from "@/Services/MapLabelService.ts";
import { MapLegService } from "@/Services/MapLegService.ts";
import { MapPanelService } from "@/Services/MapPanelService.ts";
import { MapPinService } from "@/Services/MapPinService.ts";
import { MapProjectionService } from "@/Services/MapProjectionService.ts";
import { MapRouteService } from "@/Services/MapRouteService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { RequireUtil } from "@/Utils/RequireUtil.ts";

interface MapInput {
  theme: Theme;
  warnings: string[];
  width: number;
  height: number;
}

export class MapModule {
  private static readonly PANEL_SHARE = 0.28;

  private static readonly PADDING_SHARE = 0.025;

  private static readonly PANEL_GAP = 1.6;

  private static readonly PIN_RADIUS_SHARE = 0.016;

  private static readonly MIN_PIN_RADIUS = 11;

  private static readonly SOURCE_INDENT = 4;

  private static readonly SOURCE_BOTTOM = 8;

  private static readonly SOURCE_SHADE = -0.45;

  static compileMap(scene: Scene, input: MapInput): CompileResult {
    const { theme, warnings, width, height } = input;
    const options = scene.map ?? {};
    const isPanelOn = options.panel !== false;
    const panelWidth = isPanelOn ? Math.round(width * MapModule.PANEL_SHARE) : 0;
    const padding = width * MapModule.PADDING_SHARE;
    const gap = isPanelOn ? MapModule.PANEL_GAP : 1;
    const frame: MapFrame = {
      theme, width, height, panelWidth, padding,
      area: { x0: padding, y0: padding, x1: width - panelWidth - padding * gap, y1: height - padding },
      pinRadius: Math.max(MapModule.MIN_PIN_RADIUS, height * MapModule.PIN_RADIUS_SHARE),
    };
    const route = MapRouteService.read(scene.route ?? [], warnings);
    const project = MapProjectionService.fit(route.stops, options, frame.area);
    const stops: MapStop[] = route.stops.map((stop) => {
      const [screenX, screenY] = project(stop.lon, stop.lat);
      return { ...stop, x: screenX, y: screenY };
    });
    const legs: MapLeg[] = route.transfers.map((transfer) => ({
      from: RequireUtil.defined(stops[transfer.fromIndex], "route stop"),
      to: RequireUtil.defined(stops[transfer.toIndex], "route stop"),
      by: transfer.by,
    }));
    const visited = MapBaseService.visitedCountries(stops, options);
    const countryToColor = MapBaseService.countryColors(visited, options);
    const { sea, land } = MapBaseService.paletteOf(frame);

    const countryBoxes = MapLabelService.countryBoxes(frame, project, countryToColor);
    const drawnLegs = MapLegService.build(legs, frame);
    const groups = MapPinService.group(stops, frame.pinRadius);
    const occupied = [...countryBoxes, ...drawnLegs.boxes, ...MapPinService.boxes(groups, frame.pinRadius)];
    const cityBoxes = MapLabelService.placeCities(groups, occupied, frame, warnings);

    const layers = [
      MapBaseService.draw(frame, project, countryToColor),
      MapLabelService.drawCountryLabels(countryBoxes, occupied, countryToColor, land),
      drawnLegs.paths.join("\n"),
      MapLegService.drawBadges(drawnLegs.badges, frame),
      MapPinService.draw(groups, stops.length, frame),
      MapLabelService.drawCityLabels(cityBoxes, frame),
      isPanelOn ? MapPanelService.draw(frame, stops, legs, MapModule.panelText(scene)) : "",
      MapModule.sourceNote(frame, sea),
    ];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`
      + `${layers.join("\n")}\n</svg>`;
    const description = MapModule.describe({ stops, legs, visited }, frame);
    return { svg, warnings: [...new Set<string>(warnings)], description };
  }

  private static panelText(scene: Scene): { title: string; subtitle: string | undefined } {
    const texts = scene.text ?? [];
    const title = texts.find((text) => (text.role ?? "title") === "title")?.content;
    const subtitle = texts.find((text) => text.role === "subtitle")?.content;
    return { title: String(title ?? "") || "Roteiro", subtitle: subtitle === undefined ? undefined : String(subtitle) };
  }

  private static sourceNote(frame: MapFrame, sea: string): string {
    const num = FormatUtil.oneDecimal;
    const left = frame.area.x0 + MapModule.SOURCE_INDENT;
    const baseline = frame.height - MapModule.SOURCE_BOTTOM;
    return `<text x="${num(left)}" y="${num(baseline)}" font-family="Poppins" font-size="10" `
      + `fill="${ColorUtil.sh(sea, MapModule.SOURCE_SHADE)}">Contornos: Natural Earth (domínio público)</text>`;
  }

  private static describe(
    route: { stops: readonly MapStop[]; legs: readonly MapLeg[]; visited: readonly { pt: string }[] },
    frame: MapFrame,
  ): string {
    const { stops, legs, visited } = route;
    return [
      ...stops.map((stop, index) => {
        const country = stop.country ? ` (${stop.country.pt})` : "";
        const column = Math.round(stop.x / frame.width * 100);
        const row = Math.round(stop.y / frame.height * 100);
        return `${index + 1}. ${stop.city}${country}: screen (${column}%, ${row}%)`;
      }),
      ...legs.map((leg) => `${leg.from.city} → ${leg.to.city}: ${leg.by}`),
      `highlighted countries: ${visited.map((country) => country.pt).join(", ")}`,
    ].join("\n");
  }
}
