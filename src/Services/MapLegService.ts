import type { Badge, MapFrame, MapLeg, ObstacleBox, Point } from "@/Protocols/MapProtocol.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { TransportUtil } from "@/Utils/TransportUtil.ts";

interface Curve {
  start: Point;
  control: Point;
  end: Point;
}

interface Legs {
  paths: string[];
  badges: Badge[];
  boxes: ObstacleBox[];
}

export class MapLegService {
  private static readonly BASE_RADIUS = 13;

  private static readonly RADIUS_SHARE = 0.019;

  private static readonly SHORT_LEG_RADII = 6;

  private static readonly ARROW_AT = 0.78;

  private static readonly LINE_BOX_FIRST = 0.08;

  private static readonly LINE_BOX_LAST = 0.95;

  private static readonly LINE_BOX_STEP = 0.06;

  static build(legs: readonly MapLeg[], frame: MapFrame): Legs {
    const result: Legs = { paths: [], badges: [], boxes: [] };
    const pairToRepeats = new Map<string, number>();
    const baseRadius = Math.max(MapLegService.BASE_RADIUS, frame.height * MapLegService.RADIUS_SHARE);
    for (const leg of legs) {
      const pairKey = [leg.from.city, leg.to.city].sort((first, second) => first.localeCompare(second)).join("|");
      const repeats = pairToRepeats.get(pairKey) ?? 0;
      pairToRepeats.set(pairKey, repeats + 1);
      const length = Math.hypot(leg.to.x - leg.from.x, leg.to.y - leg.from.y) || 1;
      const isShort = length < baseRadius * MapLegService.SHORT_LEG_RADII;
      MapLegService.addLeg(result, leg, { repeats, length, isShort, baseRadius }, frame);
    }
    return result;
  }

  static drawBadges(badges: readonly Badge[], frame: MapFrame): string {
    const { theme } = frame;
    const num = FormatUtil.oneDecimal;
    return badges.map((badge) => {
      const rotation = TransportUtil.rotatesBadge(badge.by) ? ` rotate(${num(badge.angle)})` : "";
      const scale = badge.radius / 14;
      return `<circle cx="${num(badge.x)}" cy="${num(badge.y + 2)}" r="${num(badge.radius)}" fill="${theme.ink}" opacity="0.18"/>`
        + `<circle cx="${num(badge.x)}" cy="${num(badge.y)}" r="${num(badge.radius)}" fill="${theme.paper}" stroke="${badge.color}" stroke-width="2.5"/>`
        + `<g transform="translate(${num(badge.x)} ${num(badge.y)})${rotation} scale(${scale.toFixed(3)})">`
        + `${TransportUtil.icon(badge.by, badge.color, theme.paper)}</g>`;
    }).join("");
  }

  private static addLeg(
    result: Legs,
    leg: MapLeg,
    shape: { repeats: number; length: number; isShort: boolean; baseRadius: number },
    frame: MapFrame,
  ): void {
    const { from, to } = leg;
    const { repeats, length, isShort, baseRadius } = shape;
    const returnShift = repeats ? 8 : 0;
    const bulge = isShort ? Math.max(26, length * 0.5) : TransportUtil.bulgeShare(leg.by) * length + returnShift;
    const normalX = -(to.y - from.y) / length;
    const normalY = (to.x - from.x) / length;
    const control: Point = [(from.x + to.x) / 2 + normalX * bulge, (from.y + to.y) / 2 + normalY * bulge];
    const curve: Curve = { start: [from.x, from.y], control, end: [to.x, to.y] };
    const color = TransportUtil.color(leg.by, frame.theme);
    result.paths.push(MapLegService.stroke(leg, curve, color, frame) + MapLegService.arrow(curve, color));
    const [middleX, middleY] = MapLegService.pointAt(curve, 0.5);
    const radius = baseRadius * (isShort ? 0.72 : 1);
    const badgeX = isShort ? middleX + normalX * radius * 1.6 : middleX;
    const badgeY = isShort ? middleY + normalY * radius * 1.6 : middleY;
    result.badges.push({ x: badgeX, y: badgeY, radius, by: leg.by, color, angle: MapLegService.angleAt(curve, 0.5) });
    result.boxes.push({ x0: badgeX - radius, x1: badgeX + radius, y0: badgeY - radius, y1: badgeY + radius, kind: "badge" });
    const { LINE_BOX_FIRST: first, LINE_BOX_LAST: last, LINE_BOX_STEP: step } = MapLegService;
    for (let along = first; along < last; along += step) {
      const [pointX, pointY] = MapLegService.pointAt(curve, along);
      result.boxes.push({ x0: pointX - 4, x1: pointX + 4, y0: pointY - 4, y1: pointY + 4, kind: "line" });
    }
  }

  private static pointAt(curve: Curve, along: number): Point {
    const { start, control, end } = curve;
    const rest = 1 - along;
    return [
      rest ** 2 * start[0] + 2 * rest * along * control[0] + along * along * end[0],
      rest ** 2 * start[1] + 2 * rest * along * control[1] + along * along * end[1],
    ];
  }

  private static angleAt(curve: Curve, along: number): number {
    const { start, control, end } = curve;
    const rest = 1 - along;
    const tangentX = 2 * rest * (control[0] - start[0]) + 2 * along * (end[0] - control[0]);
    const tangentY = 2 * rest * (control[1] - start[1]) + 2 * along * (end[1] - control[1]);
    return Math.atan2(tangentY, tangentX) * 180 / Math.PI;
  }

  private static arrow(curve: Curve, color: string): string {
    const num = FormatUtil.oneDecimal;
    const [arrowX, arrowY] = MapLegService.pointAt(curve, MapLegService.ARROW_AT);
    const angle = MapLegService.angleAt(curve, MapLegService.ARROW_AT);
    return `<path d="M-6 -6 L4 0 L-6 6" transform="translate(${num(arrowX)} ${num(arrowY)}) rotate(${num(angle)})" `
      + `stroke="${color}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  private static stroke(leg: MapLeg, curve: Curve, color: string, frame: MapFrame): string {
    const num = FormatUtil.oneDecimal;
    const { start, control, end } = curve;
    const path = `M${num(start[0])} ${num(start[1])} Q${num(control[0])} ${num(control[1])} ${num(end[0])} ${num(end[1])}`;
    return TransportUtil.routeStroke(leg.by, path, color, frame.theme.paper);
  }
}
