
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
}
