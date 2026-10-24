import type { CompilationContext, Placement, TextRect } from "@/Protocols/CompilationProtocol.ts";
import type { SceneText } from "@/Protocols/SceneProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";

interface TextLayout {
  role: string;
  fontSize: number;
  anchor: string;
  x: number;
  y: number;
  lines: string[];
  lineHeight: number;
  color: string;
  weight: number;
  estimatedWidth: number;
  left: number;
  blockHeight: number;
}

export interface TextResult {
  svg: string;
  rects: TextRect[];
}

export class TextService {
  private static readonly FONT = "Poppins";

  private static readonly ROLE_TO_SIZE: Record<string, number> = { title: 0.075, subtitle: 0.036, label: 0.028, body: 0.032 };

  private static readonly ROLE_TO_WEIGHT: Record<string, number> = { title: 700, body: 400 };

  private static readonly DEFAULT_SIZE = 0.04;

  private static readonly DEFAULT_WEIGHT = 500;

  private static readonly BOLD_WEIGHT = 700;

  private static readonly MARGIN = 0.06;

  private static readonly LINE_HEIGHT = 1.2;

  private static readonly BOLD_CHAR_WIDTH = 0.6;

  private static readonly REGULAR_CHAR_WIDTH = 0.565;

  private static readonly MIN_CONTRAST = 4.5;

  private static readonly SELF_COVER = 0.06;

  private static readonly OBJECT_COVER = 0.12;

  static render(texts: SceneText[], context: CompilationContext, list: Placement[], backdrop: string): TextResult {
    const rects: TextRect[] = [];
    let svg = "";
    for (const text of texts) {
      const layout = TextService.layoutOf(text, texts, context);
      rects.push({ x0: layout.left, y0: layout.y - layout.fontSize, x1: layout.left + layout.estimatedWidth, y1: layout.y + layout.blockHeight - layout.fontSize * 0.75, box: Boolean(text.box) });
      svg += TextService.boxOf(text, layout, context, backdrop) + TextService.element(layout);
      TextService.warnCovered(layout, list, context);
    }
    return { svg, rects };
  }

  private static themeColor(context: CompilationContext, name: string): string {
    const value = context.theme[name];
    return typeof value === "string" ? value : name;
  }

  private static layoutOf(text: SceneText, texts: SceneText[], context: CompilationContext): TextLayout {
    const { width, height, theme } = context;
    const role = text.role ?? "title";
    const fontSize = text.size ? text.size * height : (TextService.ROLE_TO_SIZE[role] ?? TextService.DEFAULT_SIZE) * height;
    const [vertical, horizontal] = (text.at ?? "top-left").split("-");
    const margin = width * TextService.MARGIN;
    const anchor = horizontal === "center" ? "middle" : horizontal === "right" ? "end" : "start";
    const defaultX = horizontal === "center" ? width / 2 : horizontal === "right" ? width - margin : margin;
    const x = text.x != null ? text.x * width : defaultX;
    const lines = String(text.content).split("\n");
    const lineHeight = fontSize * TextService.LINE_HEIGHT;
    const weight = text.weight ?? TextService.ROLE_TO_WEIGHT[role] ?? TextService.DEFAULT_WEIGHT;
    const isBold = weight >= TextService.BOLD_WEIGHT || role === "title";
    const estimatedWidth = Math.max(...lines.map((line) => line.length)) * fontSize * (isBold ? TextService.BOLD_CHAR_WIDTH : TextService.REGULAR_CHAR_WIDTH);
    const left = anchor === "start" ? x : anchor === "end" ? x - estimatedWidth : x - estimatedWidth / 2;
    return {
      role, fontSize, anchor, x, lines, lineHeight, weight, estimatedWidth, left,
      y: TextService.baseline(text, texts, { vertical, margin, fontSize, lineHeight, lineCount: lines.length }, context),
      color: text.color ? TextService.themeColor(context, text.color) : theme.text,
      blockHeight: fontSize + (lines.length - 1) * lineHeight,
    };
  }

  private static baseline(
    text: SceneText,
    texts: SceneText[],
    metrics: { vertical: string; margin: number; fontSize: number; lineHeight: number; lineCount: number },
    context: CompilationContext,
  ): number {
    const { vertical, margin, fontSize, lineHeight, lineCount } = metrics;
    if (text.y != null) {
      return text.y * context.height;
    }
    const base = vertical === "bottom" ? context.height - margin * 0.7 - (lineCount - 1) * lineHeight : margin + fontSize * 0.9;
    // Why: a subtitle at the same spot as a title goes below it instead of on top of it.
    const hasTitleAbove = (text.role ?? "title") === "subtitle"
      && texts.some((other) => (other.role ?? "title") === "title" && other.at === text.at && other.y == null);
    return hasTitleAbove ? base + context.height * TextService.ROLE_TO_SIZE.title * 0.9 + fontSize * 0.8 : base;
  }

  private static boxOf(text: SceneText, layout: TextLayout, context: CompilationContext, backdrop: string): string {
    const { fontSize, left, estimatedWidth, blockHeight, y, color, lines } = layout;
    const fill = text.box ? TextService.themeColor(context, text.box) : backdrop;
    const ratio = ColorUtil.contrast(color, fill);
    if (ratio < TextService.MIN_CONTRAST) {
      context.warnings.push(`text "${lines[0]}" has contrast ${ratio.toFixed(1)}:1 (min. 4.5); change 'color' or use 'box'`);
    }
    if (!text.box) {
      return "";
    }
    const padding = (text.pad ?? 0.45) * fontSize;
    return `<rect x="${(left - padding).toFixed(1)}" y="${(y - fontSize * 1.05 - padding * 0.3).toFixed(1)}" width="${(estimatedWidth + padding * 2).toFixed(1)}" height="${(blockHeight + fontSize * 0.45 + padding * 0.6).toFixed(1)}" rx="${(text.radius ?? 0.35) * fontSize}" fill="${fill}"/>`;
  }

  private static warnCovered(layout: TextLayout, list: Placement[], context: CompilationContext): void {
    const { left, estimatedWidth, y, blockHeight, fontSize, lines } = layout;
    for (const placement of list) {
      if (context.library[placement.asset].isBackdrop) {
        continue;
      }
      const overlapX = Math.max(0, Math.min(placement.boxRight, left + estimatedWidth) - Math.max(placement.boxLeft, left));
      const overlapY = Math.max(0, Math.min(placement.boxBottom, y + blockHeight - fontSize + fontSize * 0.25) - Math.max(placement.boxTop, y - fontSize));
      const covered = overlapX * overlapY;
      if (covered > TextService.SELF_COVER * estimatedWidth * blockHeight || covered > TextService.OBJECT_COVER * placement.width * placement.height) {
        context.warnings.push(`text "${lines[0]}" covers '${placement.id}'`);
      }
    }
  }

  private static element(layout: TextLayout): string {
    const { x, y, fontSize, weight, color, anchor, lines, lineHeight } = layout;
    const escape = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const spans = lines.map((line, index) => (index === 0
      ? `<tspan x="${x.toFixed(1)}">${escape(line)}</tspan>`
      : `<tspan x="${x.toFixed(1)}" dy="${lineHeight.toFixed(1)}">${escape(line)}</tspan>`));
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${TextService.FONT}" font-size="${fontSize.toFixed(1)}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${spans.join("")}</text>`;
  }
}
