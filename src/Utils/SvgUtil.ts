import type { ScreenPoint } from "@/Protocols/PlaneProtocol.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";

export class SvgUtil {
  private static readonly SHAPE_OP = /<(rect|path|circle|ellipse|polygon|polyline|line)\b([^>]*?)\sopacity="([\d.]+)"([^>]*?)\/>/g;

  private static readonly TEXT_OP = /<text\b([^>]*?)\sopacity="([\d.]+)"([^>]*)>/g;

  static flattenOpacity(svg: string): string {
    const withText = svg.replace(SvgUtil.TEXT_OP, (match, before: string, opacity: string, after: string) =>
      (before + after).includes("fill-opacity") ? match : `<text${before} fill-opacity="${opacity}"${after}>`);
    return withText.replace(SvgUtil.SHAPE_OP, (match, tag: string, before: string, opacity: string, after: string) =>
      /fill-opacity|stroke-opacity/.test(before + after)
        ? match
        : `<${tag}${before} fill-opacity="${opacity}" stroke-opacity="${opacity}"${after}/>`);
  }

  static escapeXml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  static polygon(points: readonly ScreenPoint[], fill: string, extra = ""): string {
    return `<polygon points="${points.map((point) => `${FormatUtil.oneDecimal(point[0])},${FormatUtil.oneDecimal(point[1])}`).join(" ")}" fill="${fill}" ${extra}/>`;
  }

  static segment(from: ScreenPoint, to: ScreenPoint): string {
    return `M${from.map(FormatUtil.oneDecimal).join(" ")} L${to.map(FormatUtil.oneDecimal).join(" ")}`;
  }
}
