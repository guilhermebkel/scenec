const SHAPE_OP = /<(rect|path|circle|ellipse|polygon|polyline|line)\b([^>]*?)\sopacity="([\d.]+)"([^>]*?)\/>/g;
const TEXT_OP = /<text\b([^>]*?)\sopacity="([\d.]+)"([^>]*)>/g;

export function flattenOpacity(svg: string): string {
  const withText = svg.replace(TEXT_OP, (match, before: string, opacity: string, after: string) =>
    (before + after).includes("fill-opacity") ? match : `<text${before} fill-opacity="${opacity}"${after}>`);
  return withText.replace(SHAPE_OP, (match, tag: string, before: string, opacity: string, after: string) =>
    /fill-opacity|stroke-opacity/.test(before + after)
      ? match
      : `<${tag}${before} fill-opacity="${opacity}" stroke-opacity="${opacity}"${after}/>`);
}

export function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}
