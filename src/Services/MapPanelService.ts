import type { MapFrame, MapLeg, MapStop } from "@/Protocols/MapProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { MapLabelService } from "@/Services/MapLabelService.ts";
import { MapPinService } from "@/Services/MapPinService.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";
import { TransportUtil } from "@/Utils/TransportUtil.ts";

interface PanelText {
  title: string;
  subtitle: string | undefined;
}

interface PanelBox {
  x: number;
  y: number;
  height: number;
}

export class MapPanelService {
  private static readonly DEFAULT_TITLE = "Roteiro";

  private static readonly CHARACTER_WIDTH = 0.58;

  private static readonly TEXT_MARGIN = 44;

  static draw(frame: MapFrame, stops: readonly MapStop[], legs: readonly MapLeg[], text: PanelText): string {
    const { theme, height, panelWidth, padding } = frame;
    const num = FormatUtil.oneDecimal;
    const box: PanelBox = { x: frame.width - panelWidth - padding * 0.6, y: padding, height: height - padding * 2 };
    let svg = `<rect x="${num(box.x + 3)}" y="${num(box.y + 5)}" width="${panelWidth}" height="${num(box.height)}" rx="18" fill="${theme.ink}" opacity="0.15"/>`
      + `<rect x="${num(box.x)}" y="${num(box.y)}" width="${panelWidth}" height="${num(box.height)}" rx="18" fill="${theme.paper}"/>`;
    const titleSize = height * 0.034;
    let cursor = box.y + 28 + titleSize;
    for (const line of MapPanelService.wrap(text.title, titleSize, panelWidth)) {
      svg += `<text x="${num(box.x + 24)}" y="${num(cursor)}" font-family="Poppins" font-weight="700" font-size="${num(titleSize)}" `
        + `fill="${MapLabelService.textColorOf(theme)}">${SvgUtil.escapeXml(line)}</text>`;
      cursor += titleSize * 1.15;
    }
    if (text.subtitle) {
      svg += `<text x="${num(box.x + 24)}" y="${num(cursor + 2)}" font-family="Poppins" font-weight="500" font-size="${num(titleSize * 0.5)}" `
        + `fill="${ColorUtil.sh(theme.ink, 0.4)}">${SvgUtil.escapeXml(text.subtitle)}</text>`;
      cursor += titleSize * 0.9;
    }
    cursor += 16;
    const stepHeight = Math.min(height * 0.072, (box.y + box.height - cursor - 70) / Math.max(1, stops.length));
    const radius = Math.min(frame.pinRadius, stepHeight * 0.3);
    stops.forEach((stop, index) => {
      const row = { frame, box, stop, leg: legs[index], index, count: stops.length };
      svg += MapPanelService.stopRow(row, { cursor, stepHeight, radius });
    });
    return svg + MapPanelService.legend(frame, box, legs);
  }

  private static wrap(title: string, fontSize: number, panelWidth: number): string[] {
    const lines: string[] = [];
    let current = "";
    for (const word of title.split(" ")) {
      if (`${current} ${word}`.trim().length * fontSize * MapPanelService.CHARACTER_WIDTH > panelWidth - MapPanelService.TEXT_MARGIN) {
        lines.push(current.trim());
        current = word;
      } else {
        current += ` ${word}`;
      }
    }
    lines.push(current.trim());
    return lines;
  }

  private static stopRow(
    row: { frame: MapFrame; box: PanelBox; stop: MapStop; leg: MapLeg | undefined; index: number; count: number },
    layout: { cursor: number; stepHeight: number; radius: number },
  ): string {
    const { frame, box, stop, leg, index, count } = row;
    const { theme } = frame;
    const { cursor, stepHeight, radius } = layout;
    const num = FormatUtil.oneDecimal;
    const centerY = cursor + index * stepHeight + radius;
    const color = MapPinService.colorOf(index === 0, index === count - 1, theme);
    const left = box.x + 24;
    let svg = leg ? MapPanelService.legRow(frame, leg, { left, centerY, stepHeight, radius }) : "";
    const country = stop.country
      ? `<tspan dx="${num(radius * 0.6)}" font-weight="400" fill="${ColorUtil.sh(theme.ink, 0.4)}">${SvgUtil.escapeXml(stop.country.pt)}</tspan>`
      : "";
    svg += `<circle cx="${num(left + radius)}" cy="${num(centerY)}" r="${num(radius)}" fill="${color}"/>`
      + `<text x="${num(left + radius)}" y="${num(centerY + radius * 0.4)}" font-family="Poppins" font-weight="700" `
      + `font-size="${num(radius * 1.1)}" fill="${theme.paper}" text-anchor="middle">${index + 1}</text>`
      + `<text x="${num(left + radius * 2 + 12)}" y="${num(centerY + radius * 0.42)}" font-family="Poppins" font-weight="600" `
      + `font-size="${num(radius * 1.15)}" fill="${MapLabelService.textColorOf(theme)}">${SvgUtil.escapeXml(stop.city)}${country}</text>`;
    return svg;
  }

  private static legRow(
    frame: MapFrame,
    leg: MapLeg,
    layout: { left: number; centerY: number; stepHeight: number; radius: number },
  ): string {
    const { theme } = frame;
    const { left, centerY, stepHeight, radius } = layout;
    const num = FormatUtil.oneDecimal;
    const color = TransportUtil.color(leg.by, theme);
    const dash = TransportUtil.panelDash(leg.by);
    return `<path d="M${num(left + radius)} ${num(centerY + radius)} L${num(left + radius)} ${num(centerY + stepHeight - radius)}" `
      + `stroke="${color}" stroke-width="3" ${dash}/>`
      + `<g transform="translate(${num(left + radius * 2 + 22)} ${num(centerY + stepHeight / 2)}) scale(${(radius / 15).toFixed(3)})">`
      + `${TransportUtil.icon(leg.by, color, theme.paper)}</g>`
      + `<text x="${num(left + radius * 2 + 38)}" y="${num(centerY + stepHeight / 2 + 4)}" font-family="Poppins" `
      + `font-size="${num(radius * 0.85)}" fill="${ColorUtil.sh(theme.ink, 0.4)}">${TransportUtil.portuguese(leg.by)}</text>`;
  }

  private static legend(frame: MapFrame, box: PanelBox, legs: readonly MapLeg[]): string {
    const { theme, height, panelWidth } = frame;
    const num = FormatUtil.oneDecimal;
    const baseline = box.y + box.height - 26;
    let svg = `<path d="M${num(box.x + 20)} ${num(baseline - 26)} L${num(box.x + panelWidth - 20)} ${num(baseline - 26)}" `
      + `stroke="${ColorUtil.sh(theme.paper, -0.12)}" stroke-width="1.5"/>`;
    let left = box.x + 24;
    for (const by of new Set(legs.map((leg) => leg.by))) {
      const color = TransportUtil.color(by, theme);
      const line = `M${num(left)} ${num(baseline - 5)} L${num(left + 30)} ${num(baseline - 5)}`;
      svg += TransportUtil.legendStroke(by, line, color, theme.paper);
      const name = TransportUtil.portuguese(by);
      svg += `<text x="${num(left + 38)}" y="${num(baseline)}" font-family="Poppins" font-size="${num(height * 0.016)}" `
        + `fill="${ColorUtil.sh(theme.ink, 0.3)}">${name}</text>`;
      left += 38 + name.length * height * 0.011 + 26;
    }
    return svg;
  }
}
