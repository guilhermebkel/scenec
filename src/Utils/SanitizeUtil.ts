import { UnsafeSvgError } from "@/Errors/UnsafeSvgError.ts";

interface Tag {
  name: string;
  attributes: [string, string][];
  isClosing: boolean;
  isSelfClosing: boolean;
  end: number;
}

interface OpenElement {
  name: string;
  isAllowed: boolean;
}

interface SanitizeState {
  output: string[];
  openElements: OpenElement[];
  skippedDepth: number;
}

interface MarkupHandler {
  prefix: string;
  read: (source: string, next: number, state: SanitizeState) => number;
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

  private static readonly QUOTE = /^["']$/;

  private static readonly MARKUP_HANDLERS: MarkupHandler[] = [
    { prefix: "<!--", read: (source, next) => SanitizeUtil.skipPast(source, next, "-->") },
    { prefix: "<![CDATA[", read: (source, next, state) => SanitizeUtil.readCdata(source, next, state) },
    { prefix: "<?", read: (source, next) => SanitizeUtil.skipPast(source, next, "?>") },
    { prefix: "<!", read: (source, next) => SanitizeUtil.skipDoctype(source, next) },
  ];

  private static skipPast(source: string, from: number, terminator: string): number {
    const at = source.indexOf(terminator, from);
    return at < 0 ? source.length : at + terminator.length;
  }

  private static skipDoctype(source: string, from: number): number {
    const end = source.indexOf(">", from);
    const bracket = source.indexOf("[", from);
    const hasSubset = bracket >= 0 && (end < 0 || bracket < end);
    if (!hasSubset) {
      return SanitizeUtil.skipPast(source, from, ">");
    }
    const afterSubset = SanitizeUtil.skipPast(source, from, "]");
    return SanitizeUtil.skipPast(source, afterSubset, ">");
  }

  private static readAttributeValue(source: string, from: number): { value: string; end: number } {
    const quote = source.charAt(from);
    if (SanitizeUtil.QUOTE.test(quote)) {
      const close = source.indexOf(quote, from + 1);
      const end = close < 0 ? source.length : close;
      return { value: source.slice(from + 1, end), end: end + 1 };
    }
    let end = from;
    while (end < source.length && !/[\s>]/.test(source[end] ?? "") && !source.startsWith("/>", end)) {
      end++;
    }
    return { value: source.slice(from, end), end };
  }

  private static readAttribute(source: string, from: number): { name: string; value: string; end: number } {
    let cursor = from;
    while (cursor < source.length && !/[\s=>]/.test(source[cursor] ?? "") && !source.startsWith("/>", cursor)) {
      cursor++;
    }
    const name = source.slice(from, cursor);
    while (/\s/.test(source[cursor] ?? "")) {
      cursor++;
    }
    if (!source.startsWith("=", cursor)) {
      return { name, value: "", end: cursor };
    }
    while (/[\s=]/.test(source[cursor] ?? "")) {
      cursor++;
    }
    const read = SanitizeUtil.readAttributeValue(source, cursor);
    return { name, value: read.value, end: read.end };
  }

  private static readTag(source: string, from: number): Tag {
    const isClosing = source.startsWith("/", from + 1);
    let cursor = from + (isClosing ? 2 : 1);
    const nameStart = cursor;
    while (cursor < source.length && !SanitizeUtil.NAME_END.test(source[cursor] ?? "")) {
      cursor++;
    }
    const name = source.slice(nameStart, cursor);
    const attributes: [string, string][] = [];
    let isSelfClosing = false;
    while (cursor < source.length && !source.startsWith(">", cursor)) {
      if (source.startsWith("/>", cursor)) {
        isSelfClosing = true;
        cursor++;
      } else if (/\s/.test(source[cursor] ?? "")) {
        cursor++;
      } else {
        const attribute = SanitizeUtil.readAttribute(source, cursor);
        attributes.push([attribute.name, attribute.value]);
        cursor = attribute.end;
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
      throw new UnsafeSvgError("<!ENTITY> declarations are not allowed in imported SVG");
    }
    const state: SanitizeState = { output: [], openElements: [], skippedDepth: 0 };
    let cursor = 0;
    while (cursor < source.length) {
      const next = source.indexOf("<", cursor);
      const textEnd = next < 0 ? source.length : next;
      if (state.skippedDepth === 0) {
        state.output.push(source.slice(cursor, textEnd));
      }
      if (next < 0) {
        break;
      }
      cursor = SanitizeUtil.readMarkup(source, next, state);
    }
    return state.output.join("");
  }

  private static readMarkup(source: string, next: number, state: SanitizeState): number {
    const handler = SanitizeUtil.MARKUP_HANDLERS.find((candidate) => source.startsWith(candidate.prefix, next));
    return handler ? handler.read(source, next, state) : SanitizeUtil.readElement(source, next, state);
  }

  private static readCdata(source: string, next: number, state: SanitizeState): number {
    const end = SanitizeUtil.skipPast(source, next, "]]>");
    const text = source.slice(next + "<![CDATA[".length, end - "]]>".length);
    state.output.push(state.skippedDepth === 0 ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;") : "");
    return end;
  }

  private static readElement(source: string, next: number, state: SanitizeState): number {
    const tag = SanitizeUtil.readTag(source, next);
    if (tag.isClosing) {
      SanitizeUtil.closeElement(state);
    } else if (state.skippedDepth > 0) {
      SanitizeUtil.skipElement(tag, state);
    } else if (SanitizeUtil.ALLOWED_ELEMENTS.has(tag.name)) {
      state.output.push(SanitizeUtil.openTag(tag));
      if (!tag.isSelfClosing) {
        state.openElements.push({ name: tag.name, isAllowed: true });
      }
    } else if (!tag.isSelfClosing) {
      state.skippedDepth = 1;
      state.openElements.push({ name: tag.name, isAllowed: false });
    }
    return tag.end;
  }

  private static closeElement(state: SanitizeState): void {
    const closed = state.openElements.pop();
    if (closed && !closed.isAllowed) {
      state.skippedDepth--;
    } else if (closed && state.skippedDepth === 0) {
      state.output.push(`</${closed.name}>`);
    }
  }

  private static skipElement(tag: Tag, state: SanitizeState): void {
    if (!tag.isSelfClosing) {
      state.skippedDepth++;
      state.openElements.push({ name: tag.name, isAllowed: false });
    }
  }
}
