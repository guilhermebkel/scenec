import type { MapFrame, MapStop, ObstacleBox, PinGroup } from "@/Protocols/MapProtocol.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";

export class MapPinService {
  static readonly NUMBER_SPACING = 1.6;

  private static readonly MERGE_DISTANCE = 2;

  private static readonly NEIGHBOR_RADII_X = 6;

  private static readonly NEIGHBOR_RADII_Y = 3;

  static group(stops: readonly MapStop[], pinRadius: number): PinGroup[] {
    const merged: (MapStop & { numbers: number[] })[] = [];
    stops.forEach((stop, index) => {
      const existing = merged.find(
        (other) => Math.hypot(other.x - stop.x, other.y - stop.y) < MapPinService.MERGE_DISTANCE,
      );
      if (existing) {
        existing.numbers.push(index + 1);
      } else {
        merged.push({ ...stop, numbers: [index + 1] });
      }
    });
    return merged.map((group) => {
      const hasNeighborOnRight = merged.some((other) => other !== group
        && other.x > group.x
        && other.x - group.x < pinRadius * MapPinService.NEIGHBOR_RADII_X
        && Math.abs(other.y - group.y) < pinRadius * MapPinService.NEIGHBOR_RADII_Y);
      return { ...group, direction: hasNeighborOnRight ? -1 : 1 };
    });
  }

  static boxes(groups: readonly PinGroup[], pinRadius: number): ObstacleBox[] {
    return groups.map((group) => {
      const extent = (group.numbers.length - 1) * pinRadius * MapPinService.NUMBER_SPACING;
      return {
        x0: group.x - pinRadius - (group.direction < 0 ? extent : 0),
        x1: group.x + pinRadius + (group.direction > 0 ? extent : 0),
        y0: group.y - pinRadius,
        y1: group.y + pinRadius,
        kind: "pin",
      };
    });
  }

  static draw(groups: readonly PinGroup[], stopCount: number, frame: MapFrame): string {
    const { theme, pinRadius } = frame;
    const num = FormatUtil.oneDecimal;
    return groups.map((group) => group.numbers.map((number, position) => {
      const pinX = group.x + group.direction * position * pinRadius * MapPinService.NUMBER_SPACING;
      const isLast = number === stopCount;
      const isFirst = number === 1;
      const color = MapPinService.colorOf(isFirst, isLast, theme);
      return `<circle cx="${num(pinX)}" cy="${num(group.y + 2.5)}" r="${num(pinRadius)}" fill="${theme.ink}" opacity="0.2"/>`
        + `<circle cx="${num(pinX)}" cy="${num(group.y)}" r="${num(pinRadius)}" fill="${color}" stroke="${theme.paper}" stroke-width="2.5"/>`
        + `<text x="${num(pinX)}" y="${num(group.y + pinRadius * 0.4)}" font-family="Poppins" font-weight="700" `
        + `font-size="${num(pinRadius * 1.15)}" fill="${theme.paper}" text-anchor="middle">${number}</text>`;
    }).join("")).join("");
  }

  static colorOf(isFirst: boolean, isLast: boolean, theme: MapFrame["theme"]): string {
    if (isLast) {
      return theme.accent;
    }
    return isFirst ? theme.secondary : theme.primary;
  }
}
