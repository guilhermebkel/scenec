import { UnsafeSvgError } from "@/utils/UnsafeSvgError.ts";

interface Tag {
  name: string;
  attributes: [string, string][];
  isClosing: boolean;
  isSelfClosing: boolean;
  end: number;
}
export class SanitizeUtil {
  private static readonly ALLOWED_ELEMENTS = new Set([
    "svg", "g", "defs", "title", "desc", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan",
    "linearGradient", "radialGradient", "stop", "clipPath", "mask", "pattern", "symbol", "use", "image", "filter",
    "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDropShadow", "feFlood",
    "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feMerge", "feMergeNode", "feMorphology", "feOffset",
    "feTurbulence",
  ]);

  static isAllowedElement(name: string): boolean {
    return SanitizeUtil.ALLOWED_ELEMENTS.has(name);
  }

  private static readonly LINK_ATTRIBUTES = new Set(["href", "xlink:href"]);

  private static readonly SAFE_LINK = /^(#|data:image\/(png|jpeg|jpg|webp|gif);base64,)/;

  private static readonly EXTERNAL_URL = /url\(\s*['"]?\s*(?!#)/i;

  private static readonly STANDARD_ENTITY = /&(?!(?:lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);)/i;

  private static readonly NAME_END = /[\s/>]/;

  private static skipPast(source: string, from: number, terminator: string): number {
    const at = source.indexOf(terminator, from);
    return at < 0 ? source.length : at + terminator.length;
  }

  private static skipDoctype(source: string, from: number): number {
    const end = source.indexOf(">", from);
    const bracket = source.indexOf("[", from);
    const hasSubset = bracket >= 0 && (end < 0 || bracket < end);
    return hasSubset ? SanitizeUtil.skipPast(source, SanitizeUtil.skipPast(source, from, "]"), ">") : SanitizeUtil.skipPast(source, from, ">");
  }

  private static readAttributeValue(source: string, from: number): { value: string; end: number } {
    const quote = source[from];
    if (quote === "\"" || quote === "'") {
      const close = source.indexOf(quote, from + 1);
      const end = close < 0 ? source.length : close;
      return { value: source.slice(from + 1, end), end: end + 1 };
    }
    let end = from;
    while (end < source.length && !/[\s>]/.test(source[end] ?? "") && !(source[end] === "/" && source[end + 1] === ">")) {
      end++;
    }
    return { value: source.slice(from, end), end };
  }

  private static readTag(source: string, from: number): Tag {
    const isClosing = source[from + 1] === "/";
    let cursor = from + (isClosing ? 2 : 1);
    const nameStart = cursor;
    while (cursor < source.length && !SanitizeUtil.NAME_END.test(source[cursor] ?? "")) {
      cursor++;
    }
    const name = source.slice(nameStart, cursor);
    const attributes: [string, string][] = [];
    let isSelfClosing = false;
    while (cursor < source.length && source[cursor] !== ">") {
      if (source[cursor] === "/" && source[cursor + 1] === ">") {
        isSelfClosing = true;
        cursor++;
      } else if (/\s/.test(source[cursor] ?? "")) {
        cursor++;
      } else {
        const attributeStart = cursor;
        while (cursor < source.length && !/[\s=>]/.test(source[cursor] ?? "") && !(source[cursor] === "/" && source[cursor + 1] === ">")) {
          cursor++;
        }
        const attributeName = source.slice(attributeStart, cursor);
        while (/\s/.test(source[cursor] ?? "")) {
          cursor++;
        }
        let value = "";
        if (source[cursor] === "=") {
          while (/[\s=]/.test(source[cursor] ?? "")) {
            cursor++;
          }
          const read = SanitizeUtil.readAttributeValue(source, cursor);
          value = read.value;
          cursor = read.end;
        }
        attributes.push([attributeName, value]);
      }
    }
    return { name, attributes, isClosing, isSelfClosing, end: cursor + 1 };
  }

  private static isSafeAttribute(name: string, value: string): boolean {
    const lower = name.toLowerCase();
    if (lower.startsWith("on") || SanitizeUtil.STANDARD_ENTITY.test(value)) {
      return false;
    }
    if (SanitizeUtil.LINK_ATTRIBUTES.has(lower)) {
      return SanitizeUtil.SAFE_LINK.test(value.trim());
    }
    return !SanitizeUtil.EXTERNAL_URL.test(value) && !/javascript:/i.test(value);
  }

  private static escapeAttribute(value: string): string {
    return value.replace(/"/g, "&quot;");
  }

  private static openTag(tag: Tag): string {
    const attributes = tag.attributes
      .filter(([name, value]) => SanitizeUtil.isSafeAttribute(name, value))
      .map(([name, value]) => ` ${name}="${SanitizeUtil.escapeAttribute(value)}"`)
      .join("");
    return `<${tag.name}${attributes}${tag.isSelfClosing ? "/" : ""}>`;
  }

  static sanitizeSvg(source: string): string {
    if (/<!ENTITY/i.test(source)) {
      throw new UnsafeSvgError("declarações <!ENTITY> não são permitidas em SVG importado");
    }
    const output: string[] = [];
    const openElements: { name: string; isAllowed: boolean }[] = [];
    let skippedDepth = 0;
    let cursor = 0;
    while (cursor < source.length) {
      const next = source.indexOf("<", cursor);
      const textEnd = next < 0 ? source.length : next;
      if (skippedDepth === 0) {
        output.push(source.slice(cursor, textEnd));
      }
      if (next < 0) {
        break;
      }
      if (source.startsWith("<!--", next)) {
        cursor = SanitizeUtil.skipPast(source, next, "-->");
      } else if (source.startsWith("<![CDATA[", next)) {
        const end = SanitizeUtil.skipPast(source, next, "]]>");
        const text = source.slice(next + "<![CDATA[".length, end - "]]>".length);
        output.push(skippedDepth === 0 ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;") : "");
        cursor = end;
      } else if (source.startsWith("<?", next)) {
        cursor = SanitizeUtil.skipPast(source, next, "?>");
      } else if (source.startsWith("<!", next)) {
        cursor = SanitizeUtil.skipDoctype(source, next);
      } else {
        const tag = SanitizeUtil.readTag(source, next);
        cursor = tag.end;
        if (tag.isClosing) {
          const closed = openElements.pop();
          if (closed && !closed.isAllowed) {
            skippedDepth--;
          } else if (closed && skippedDepth === 0) {
            output.push(`</${closed.name}>`);
          }
        } else if (skippedDepth > 0) {
          skippedDepth += tag.isSelfClosing ? 0 : 1;
          if (!tag.isSelfClosing) {
            openElements.push({ name: tag.name, isAllowed: false });
          }
        } else if (SanitizeUtil.ALLOWED_ELEMENTS.has(tag.name)) {
          output.push(SanitizeUtil.openTag(tag));
          if (!tag.isSelfClosing) {
            openElements.push({ name: tag.name, isAllowed: true });
          }
        } else if (!tag.isSelfClosing) {
          skippedDepth = 1;
          openElements.push({ name: tag.name, isAllowed: false });
        }
      }
    }
    return output.join("");
  }
}
