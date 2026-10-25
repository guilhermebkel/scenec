import type { Box, CityBox, CountryBox, LabelBox, MapCountry, MapFrame, PinGroup, Projector } from "@/Protocols/MapProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { MapPinService } from "@/Services/MapPinService.ts";
import { MapRouteService } from "@/Services/MapRouteService.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";

export class MapLabelService {
  private static readonly KIND_TO_WEIGHT: Record<Exclude<LabelBox["kind"], "country">, number> = {
    city: 6, pin: 5, badge: 4, line: 3,
  };

  private static readonly KIND_TO_BLOCKS: Record<LabelBox["kind"], boolean> = {
    country: false, line: false, city: true, pin: true, badge: true,
  };

  private static readonly COUNTRY_SHIFTS: readonly (readonly [number, number])[] = [
    [0, 30], [0, -30], [40, 0], [-40, 0], [0, 55], [0, -55],
  ];

  private static readonly OUTSIDE_PENALTY = 1e7;

  private static readonly VISITED_WEIGHT = 1.5;

  private static readonly OTHER_COUNTRY_WEIGHT = 0.6;

  private static readonly ACCEPTED_OVERLAP = 0.12;

  private static readonly MIN_COUNTRY_AREA = 0.004;

  private static readonly MIN_SHIFTED_COUNTRY_AREA = 0.002;

  private static readonly COUNTRY_HIT_SHARE = 0.02;

  static textColorOf(theme: Theme): string {
    return theme.text === theme.paper ? theme.ink : theme.text;
  }

  static countryBoxes(
    frame: MapFrame,
    project: Projector,
    countryToColor: ReadonlyMap<MapCountry, string>,
  ): CountryBox[] {
    const baseSize = Math.max(12, frame.height * 0.017);
    const boxes: CountryBox[] = [];
    for (const country of MapRouteService.COUNTRIES) {
      const isVisited = countryToColor.has(country);
      if (!isVisited && country.area < MapLabelService.MIN_COUNTRY_AREA) {
        continue;
      }
      const [labelX, labelY] = project(country.label[0] ?? 0, country.label[1] ?? 0);
      const fontSize = isVisited ? baseSize * 1.05 : baseSize * 0.9;
      const text = isVisited ? country.pt.toUpperCase() : country.pt;
      const width = text.length * fontSize * (isVisited ? 0.66 : 0.58);
      const box: CountryBox = {
        x0: labelX - width / 2, x1: labelX + width / 2, y0: labelY - fontSize, y1: labelY + fontSize * 0.3,
        kind: "country", isVisited, country, text, fontSize, x: labelX, y: labelY,
      };
      if (MapLabelService.isInside(box, frame.area)) {
        boxes.push(box);
      }
    }
    return boxes;
  }

  static placeCities(
    groups: readonly PinGroup[],
    occupied: LabelBox[],
    frame: MapFrame,
    warnings: string[],
  ): CityBox[] {
    const placed: CityBox[] = [];
    const fontSize = Math.max(14, frame.height * 0.021);
    for (const group of groups) {
      const name = group.city;
      const sub = group.country ? group.country.pt : "";
      const width = Math.max(name.length * fontSize * 0.6, sub.length * fontSize * 0.45) + fontSize * 1.2;
      const height = fontSize * (sub ? 2.35 : 1.6);
      let best: Box = { x0: 0, y0: 0, x1: width, y1: height };
      let bestScore = Infinity;
      for (const [x0, y0] of MapLabelService.candidates(group, frame.pinRadius, width, height)) {
        const candidate: Box = { x0, y0, x1: x0 + width, y1: y0 + height };
        const score = MapLabelService.scoreOf(candidate, occupied, frame.area);
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      if (bestScore > MapLabelService.ACCEPTED_OVERLAP * width * height) {
        warnings.push(`label of city '${name}' overlaps (${Math.round(bestScore / (width * height) * 100)}%); adjust the map 'padding' or use 'label_side'`);
      }
      const box: CityBox = { ...best, kind: "city", name, sub };
      occupied.push(box);
      placed.push(box);
    }
    return placed;
  }

  static drawCityLabels(boxes: readonly CityBox[], frame: MapFrame): string {
    const { theme } = frame;
    const num = FormatUtil.oneDecimal;
    const fontSize = Math.max(14, frame.height * 0.021);
    return boxes.map((box) => {
      const width = num(box.x1 - box.x0);
      const height = num(box.y1 - box.y0);
      const left = num(box.x0 + fontSize * 0.6);
      const sub = box.sub
        ? `<text x="${left}" y="${num(box.y0 + fontSize * 1.95)}" font-family="Poppins" font-weight="500" `
        + `font-size="${num(fontSize * 0.68)}" fill="${ColorUtil.sh(theme.ink, 0.35)}">${SvgUtil.escapeXml(box.sub)}</text>`
        : "";
      return `<rect x="${num(box.x0 + 1.5)}" y="${num(box.y0 + 2.5)}" width="${width}" height="${height}" rx="8" fill="${theme.ink}" opacity="0.14"/>`
        + `<rect x="${num(box.x0)}" y="${num(box.y0)}" width="${width}" height="${height}" rx="8" fill="${theme.paper}"/>`
        + `<text x="${left}" y="${num(box.y0 + fontSize * 1.15)}" font-family="Poppins" font-weight="700" `
        + `font-size="${num(fontSize)}" fill="${MapLabelService.textColorOf(theme)}">${SvgUtil.escapeXml(box.name)}</text>${sub}`;
    }).join("");
  }

  static drawCountryLabels(
    boxes: readonly CountryBox[],
    occupied: readonly LabelBox[],
    countryToColor: ReadonlyMap<MapCountry, string>,
    land: string,
  ): string {
    let svg = "";
    for (const box of boxes) {
      const position = MapLabelService.countryPosition(box, occupied);
      if (!position) {
        continue;
      }
      const textX = FormatUtil.oneDecimal(position[0]);
      const textY = FormatUtil.oneDecimal(position[1]);
      const size = FormatUtil.oneDecimal(box.fontSize);
      const text = SvgUtil.escapeXml(box.text);
      svg += box.isVisited
        ? `<text x="${textX}" y="${textY}" font-family="Poppins" font-weight="700" font-size="${size}" letter-spacing="2" `
        + `fill="${ColorUtil.sh(countryToColor.get(box.country) ?? "", -0.55)}" text-anchor="middle" opacity="0.8">${text}</text>`
        : `<text x="${textX}" y="${textY}" font-family="Poppins" font-weight="500" font-size="${size}" `
          + `fill="${ColorUtil.sh(land, -0.4)}" text-anchor="middle">${text}</text>`;
    }
    return svg;
  }

  private static countryPosition(box: CountryBox, occupied: readonly LabelBox[]): [number, number] | null {
    const area = (box.x1 - box.x0) * (box.y1 - box.y0);
    const isHit = occupied.some((other) => other !== box && MapLabelService.blocks(other)
      && MapLabelService.overlap(box, other) > MapLabelService.COUNTRY_HIT_SHARE * area);
    if (!isHit) {
      return [box.x, box.y];
    }
    if (!box.isVisited || box.country.area < MapLabelService.MIN_SHIFTED_COUNTRY_AREA) {
      return null;
    }
    for (const [shiftX, shiftY] of MapLabelService.COUNTRY_SHIFTS) {
      const moved: Box = { x0: box.x0 + shiftX, x1: box.x1 + shiftX, y0: box.y0 + shiftY, y1: box.y1 + shiftY };
      const isFree = !occupied.some(
        (other) => other !== box && MapLabelService.blocks(other) && MapLabelService.overlap(moved, other) > 0,
      );
      if (isFree) {
        return [box.x + shiftX, box.y + shiftY];
      }
    }
    return null;
  }

  private static blocks(box: LabelBox): boolean {
    return MapLabelService.KIND_TO_BLOCKS[box.kind];
  }

  private static candidates(group: PinGroup, pinRadius: number, width: number, height: number): [number, number][] {
    const extent = (group.numbers.length - 1) * pinRadius * MapPinService.NUMBER_SPACING;
    const right = pinRadius + (group.direction > 0 ? extent : 0) + 8;
    const left = pinRadius + (group.direction < 0 ? extent : 0) + 8;
    return [
      [group.x + right, group.y - height / 2],
      [group.x - left - width, group.y - height / 2],
      [group.x - width / 2, group.y - pinRadius - 10 - height],
      [group.x - width / 2, group.y + pinRadius + 10],
      [group.x + right, group.y - height - 6],
      [group.x - pinRadius - 8 - width, group.y - height - 6],
      [group.x + right, group.y + 6],
      [group.x - pinRadius - 8 - width, group.y + 6],
    ];
  }

  private static scoreOf(candidate: Box, occupied: readonly LabelBox[], area: Box): number {
    let score = MapLabelService.isInside(candidate, area) ? 0 : MapLabelService.OUTSIDE_PENALTY;
    for (const other of occupied) {
      score += MapLabelService.overlap(candidate, other) * MapLabelService.weightOf(other);
    }
    return score;
  }

  private static weightOf(box: LabelBox): number {
    if (box.kind === "country") {
      return box.isVisited ? MapLabelService.VISITED_WEIGHT : MapLabelService.OTHER_COUNTRY_WEIGHT;
    }
    return MapLabelService.KIND_TO_WEIGHT[box.kind];
  }

  private static overlap(first: Box, second: Box): number {
    const width = Math.max(0, Math.min(first.x1, second.x1) - Math.max(first.x0, second.x0));
    const height = Math.max(0, Math.min(first.y1, second.y1) - Math.max(first.y0, second.y0));
    return width * height;
  }

  private static isInside(box: Box, area: Box): boolean {
    return box.x0 >= area.x0 && box.x1 <= area.x1 && box.y0 >= area.y0 && box.y1 <= area.y1;
  }
}
