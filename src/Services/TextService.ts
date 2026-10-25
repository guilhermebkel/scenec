import type { CompilationContext, Placement, TextRect } from "@/Protocols/CompilationProtocol.ts";
import type { SceneText, TextRole } from "@/Protocols/SceneProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";

const HORIZONTAL_NAMES = ["left", "center", "right"] as const;

type HorizontalName = (typeof HORIZONTAL_NAMES)[number];

type AnchorName = "start" | "middle" | "end";

interface Alignment {
  anchor: AnchorName;
  startX: (width: number, margin: number) => number;
  leftOf: (anchorX: number, textWidth: number) => number;
}

interface TextLayout {
  role: TextRole;
  fontSize: number;
  anchor: AnchorName;
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

interface Metrics {
  isBottom: boolean;
  margin: number;
  fontSize: number;
  lineHeight: number;
  lineCount: number;
}

export interface TextResult {
  svg: string;
  rects: TextRect[];
}

export class TextService {
  private static readonly FONT = "Poppins";

  private static readonly TITLE_SIZE = 0.075;

  private static readonly SUBTITLE_SIZE = 0.036;

  private static readonly LABEL_SIZE = 0.028;

  private static readonly BODY_SIZE = 0.032;

  private static readonly ROLE_TO_SIZE: Record<TextRole, number> = {
    title: TextService.TITLE_SIZE,
    subtitle: TextService.SUBTITLE_SIZE,
    label: TextService.LABEL_SIZE,
    body: TextService.BODY_SIZE,
  };

  private static readonly BOLD_WEIGHT = 700;

  private static readonly REGULAR_WEIGHT = 400;

  private static readonly ROLE_TO_WEIGHT: Partial<Record<TextRole, number>> = {
    title: TextService.BOLD_WEIGHT,
    body: TextService.REGULAR_WEIGHT,
  };

  private static readonly ROLE_TO_IS_BOLD: Partial<Record<TextRole, boolean>> = { title: true };

  private static readonly HORIZONTAL_TO_ALIGNMENT: Record<HorizontalName, Alignment> = {
    left: { anchor: "start", startX: (_width, margin) => margin, leftOf: (anchorX) => anchorX },
    center: {
      anchor: "middle",
      startX: (width) => width / 2,
      leftOf: (anchorX, textWidth) => anchorX - textWidth / 2,
    },
    right: {
      anchor: "end",
      startX: (width, margin) => width - margin,
      leftOf: (anchorX, textWidth) => anchorX - textWidth,
    },
  };

  private static readonly DEFAULT_SIZE = 0.04;

  private static readonly DEFAULT_WEIGHT = 500;

  private static readonly MARGIN = 0.06;

  private static readonly BOTTOM_MARGIN = 0.7;

  private static readonly BASELINE_ASCENT = 0.9;

  private static readonly SUBTITLE_GAP = 0.8;

  private static readonly LINE_HEIGHT = 1.2;

  private static readonly BOLD_CHAR_WIDTH = 0.6;

  private static readonly REGULAR_CHAR_WIDTH = 0.565;

  private static readonly MIN_CONTRAST = 4.5;

  private static readonly SELF_COVER = 0.06;

  private static readonly OBJECT_COVER = 0.12;

  private static readonly DESCENT = 0.25;

  private static readonly RECT_DESCENT = 0.75;

  private static readonly DEFAULT_PAD = 0.45;

  private static readonly DEFAULT_RADIUS = 0.35;

  private static readonly BOX_ASCENT = 1.05;

  private static readonly BOX_TOP_PAD = 0.3;

  private static readonly BOX_BOTTOM_EXTRA = 0.45;

  private static readonly BOX_BOTTOM_PAD = 0.6;

  static render(texts: SceneText[], context: CompilationContext, list: Placement[], backdrop: string): TextResult {
    const rects: TextRect[] = [];
    let svg = "";
    for (const text of texts) {
      const layout = TextService.layoutOf(text, texts, context);
      const { left, y, fontSize, estimatedWidth, blockHeight } = layout;
      rects.push({
        x0: left,
        y0: y - fontSize,
        x1: left + estimatedWidth,
        y1: y + blockHeight - fontSize * TextService.RECT_DESCENT,
        hasBox: Boolean(text.box),
      });
      svg += TextService.boxOf(text, layout, context, backdrop) + TextService.element(layout);
      TextService.warnCovered(layout, list, context);
    }
    return { svg, rects };
  }

  private static themeColor(context: CompilationContext, name: string): string {
    const value = context.theme[name];
    return typeof value === "string" ? value : name;
  }

  private static isRole(text: SceneText, role: TextRole): boolean {
    return (text.role ?? "title") === role;
  }

  private static layoutOf(text: SceneText, texts: SceneText[], context: CompilationContext): TextLayout {
    const { width, height, theme } = context;
    const role = text.role ?? "title";
    const roleSize = IdUtil.lookup(TextService.ROLE_TO_SIZE, role) ?? TextService.DEFAULT_SIZE;
    const fontSize = text.size ? text.size * height : roleSize * height;
    const [vertical = "top", horizontalText] = (text.at ?? "top-left").split("-");
    const horizontal = IdUtil.isOneOf(HORIZONTAL_NAMES, horizontalText) ? horizontalText : "left";
    const alignment = TextService.HORIZONTAL_TO_ALIGNMENT[horizontal];
    const margin = width * TextService.MARGIN;
    const defaultX = alignment.startX(width, margin);
    const anchorX = text.x != null ? text.x * width : defaultX;
    const lines = String(text.content).split("\n");
    const lineHeight = fontSize * TextService.LINE_HEIGHT;
    const weight = text.weight ?? IdUtil.lookup(TextService.ROLE_TO_WEIGHT, role) ?? TextService.DEFAULT_WEIGHT;
    const isBold = weight >= TextService.BOLD_WEIGHT || IdUtil.lookup(TextService.ROLE_TO_IS_BOLD, role) === true;
    const charWidth = isBold ? TextService.BOLD_CHAR_WIDTH : TextService.REGULAR_CHAR_WIDTH;
    const estimatedWidth = Math.max(...lines.map((line) => line.length)) * fontSize * charWidth;
    const metrics = { isBottom: vertical === "bottom", margin, fontSize, lineHeight, lineCount: lines.length };
    return {
      role, fontSize, anchor: alignment.anchor, x: anchorX, lines, lineHeight, weight, estimatedWidth,
      left: alignment.leftOf(anchorX, estimatedWidth),
      y: TextService.baseline(text, texts, metrics, context),
      color: text.color ? TextService.themeColor(context, text.color) : theme.text,
      blockHeight: fontSize + (lines.length - 1) * lineHeight,
    };
  }

  private static baseline(text: SceneText, texts: SceneText[], metrics: Metrics, context: CompilationContext): number {
    const { isBottom, margin, fontSize, lineHeight, lineCount } = metrics;
    if (text.y != null) {
      return text.y * context.height;
    }
    const bottomBase = context.height - margin * TextService.BOTTOM_MARGIN - (lineCount - 1) * lineHeight;
    const base = isBottom ? bottomBase : margin + fontSize * TextService.BASELINE_ASCENT;
    // Why: a subtitle at the same spot as a title goes below it instead of on top of it.
    const hasTitleAbove = TextService.isRole(text, "subtitle")
      && texts.some((other) => TextService.isRole(other, "title") && other.at === text.at && other.y == null);
    const shift = context.height * TextService.TITLE_SIZE * TextService.BASELINE_ASCENT
      + fontSize * TextService.SUBTITLE_GAP;
    return hasTitleAbove ? base + shift : base;
  }

  private static boxOf(text: SceneText, layout: TextLayout, context: CompilationContext, backdrop: string): string {
    const { fontSize, left, estimatedWidth, blockHeight, y, color, lines } = layout;
    const fill = text.box ? TextService.themeColor(context, text.box) : backdrop;
    const ratio = ColorUtil.contrast(color, fill);
    if (ratio < TextService.MIN_CONTRAST) {
      context.warnings.push(
        `text "${lines[0]}" has contrast ${ratio.toFixed(1)}:1 (min. 4.5); change 'color' or use 'box'`,
      );
    }
    if (!text.box) {
      return "";
    }
    const padding = (text.pad ?? TextService.DEFAULT_PAD) * fontSize;
    const boxY = y - fontSize * TextService.BOX_ASCENT - padding * TextService.BOX_TOP_PAD;
    const boxHeight = blockHeight + fontSize * TextService.BOX_BOTTOM_EXTRA + padding * TextService.BOX_BOTTOM_PAD;
    const radius = (text.radius ?? TextService.DEFAULT_RADIUS) * fontSize;
    return `<rect x="${(left - padding).toFixed(1)}" y="${boxY.toFixed(1)}" `
      + `width="${(estimatedWidth + padding * 2).toFixed(1)}" height="${boxHeight.toFixed(1)}" `
      + `rx="${radius}" fill="${fill}"/>`;
  }

  private static warnCovered(layout: TextLayout, list: Placement[], context: CompilationContext): void {
    const { left, estimatedWidth, y, blockHeight, fontSize, lines } = layout;
    for (const placement of list) {
      if (placement.isBackdrop) {
        continue;
      }
      const overlapX = Math.max(
        0,
        Math.min(placement.boxRight, left + estimatedWidth) - Math.max(placement.boxLeft, left),
      );
      const textBottom = y + blockHeight - fontSize + fontSize * TextService.DESCENT;
      const overlapY = Math.max(
        0,
        Math.min(placement.boxBottom, textBottom) - Math.max(placement.boxTop, y - fontSize),
      );
      const covered = overlapX * overlapY;
      const selfLimit = TextService.SELF_COVER * estimatedWidth * blockHeight;
      const objectLimit = TextService.OBJECT_COVER * placement.width * placement.height;
      if (covered > selfLimit || covered > objectLimit) {
        context.warnings.push(`text "${lines[0]}" covers '${placement.id}'`);
      }
    }
  }

  private static element(layout: TextLayout): string {
    const { x, y, fontSize, weight, color, anchor, lines, lineHeight } = layout;
    const escape = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const spans = lines.map((line, index) => {
      const dy = index === 0 ? "" : ` dy="${lineHeight.toFixed(1)}"`;
      return `<tspan x="${x.toFixed(1)}"${dy}>${escape(line)}</tspan>`;
    });
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${TextService.FONT}" `
      + `font-size="${fontSize.toFixed(1)}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">`
      + `${spans.join("")}</text>`;
  }
}
