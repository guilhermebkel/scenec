import type { CompilationContext, Placement, TextRect } from "@/Protocols/CompilationProtocol.ts";
import type { BoxStyle, FontName, SceneText, TextRole } from "@/Protocols/SceneProtocol.ts";
import { KitService } from "@/Services/KitService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { TypesettingUtil } from "@/Utils/TypesettingUtil.ts";

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
  fontFamily: string;
  tracking: number;
  charWidth: number;
  boxStyle?: BoxStyle;
  rotation?: number;
  emphasis?: readonly string[];
  hasBox: boolean;
  boxFill?: string;
  pad?: number;
  radius?: number;
  index: number;
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

  private static readonly ANCHOR_TO_LEFT_OF: Record<AnchorName, (anchorX: number, textWidth: number) => number> = {
    start: (anchorX) => anchorX,
    middle: (anchorX, textWidth) => anchorX - textWidth * TextService.HALF,
    end: (anchorX, textWidth) => anchorX - textWidth,
  };

  private static readonly DEFAULT_SIZE = 0.04;

  private static readonly DEFAULT_WEIGHT = 500;

  private static readonly MARGIN = 0.06;

  private static readonly BOTTOM_MARGIN = 0.7;

  private static readonly BASELINE_ASCENT = 0.9;

  private static readonly SUBTITLE_GAP = 0.8;

  private static readonly LINE_HEIGHT = 1.2;

  private static readonly FONT_NAME_TO_FAMILY: Record<FontName, string> = {
    sans: "Poppins",
    serif: "DM Serif Display",
    hand: "Patrick Hand",
  };

  private static readonly FONT_TO_CHAR_WIDTH: Record<FontName, { regular: number; bold: number }> = {
    sans: { regular: 0.565, bold: 0.6 },
    serif: { regular: 0.49, bold: 0.53 },
    hand: { regular: 0.42, bold: 0.45 },
  };

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

  private static readonly TRACKING_THRESHOLD_PX = 36;

  private static readonly DEFAULT_TIGHT_TRACKING = -0.015;

  private static readonly TRACKING_DECIMALS = 3;

  private static readonly DEFAULT_STICKER_ROTATION = -1.5;

  private static readonly STICKER_STROKE_FRACTION = 0.12;

  private static readonly STICKER_MIN_STROKE = 3;

  private static readonly STICKER_SHADOW_DY = 0.1;

  private static readonly STICKER_SHADOW_BLUR = 0.12;

  private static readonly STICKER_SHADOW_OPACITY = 0.25;

  private static readonly PILL_HORIZONTAL_PAD = 0.6;

  private static readonly PILL_VERTICAL_PAD = 0.35;

  private static readonly PILL_SHADOW_DY = 0.08;

  private static readonly PILL_SHADOW_BLUR = 0.12;

  private static readonly PILL_SHADOW_OPACITY = 0.22;

  private static readonly HIGHLIGHT_TOP = 0.78;

  private static readonly HIGHLIGHT_BOTTOM = 0.15;

  private static readonly HIGHLIGHT_PAD = 0.2;

  private static readonly HIGHLIGHT_SKEW = 0.08;

  private static readonly HIGHLIGHT_OPACITY = 0.38;

  private static readonly UNDERLINE_Y_OFFSET = 0.16;

  private static readonly UNDERLINE_WAVE = 0.08;

  private static readonly UNDERLINE_STROKE_FRACTION = 0.07;

  private static readonly UNDERLINE_MIN_STROKE = 2;

  private static readonly HALF_CIRCLE_DEG = 180;

  private static readonly DEG_TO_RAD = Math.PI / TextService.HALF_CIRCLE_DEG;

  private static readonly HALF = 0.5;

  private static readonly STYLE_IGNORES_CONTRAST = new Set<BoxStyle>(["highlight", "underline"]);

  private static readonly BOX_STYLE_TO_RECT: Record<BoxStyle, (layout: TextLayout) => TextRect> = {
    rect: (layout) => TextService.rectForDefault(layout),
    pill: (layout) => TextService.rectForPill(layout),
    sticker: (layout) => TextService.rectForSticker(layout),
    highlight: (layout) => TextService.rectForHighlight(layout),
    underline: (layout) => TextService.rectForUnderline(layout),
  };

  static render(texts: SceneText[], context: CompilationContext, list: Placement[], backdrop: string): TextResult {
    const rects: TextRect[] = [];
    let svg = "";
    for (let index = 0; index < texts.length; index++) {
      const text = texts[index];
      if (!text) {
        continue;
      }
      const layout = TextService.layoutOf(text, texts, context, index);
      rects.push(TextService.rectOf(layout));
      svg += TextService.boxOf(layout, context, backdrop) + TextService.element(layout);
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

  private static layoutOf(
    text: SceneText,
    texts: SceneText[],
    context: CompilationContext,
    index: number,
  ): TextLayout {
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
    const kit = context.canvas.kit ? IdUtil.lookup(KitService.KIT_ID_TO_KIT, context.canvas.kit) : undefined;
    const fontName: FontName = text.font ?? context.canvas.font ?? kit?.font ?? "sans";
    const fontFamily = TextService.FONT_NAME_TO_FAMILY[fontName];
    const tracking = TextService.resolveTracking(text.tracking, fontSize);
    const lines = TypesettingUtil.splitLines(String(text.content), {
      wrap: text.wrap,
      hasBalance: text.balance ?? (role === "title" && text.wrap != null),
    });
    const lineHeight = fontSize * TextService.LINE_HEIGHT;
    const weight = text.weight ?? IdUtil.lookup(TextService.ROLE_TO_WEIGHT, role) ?? TextService.DEFAULT_WEIGHT;
    const isBold = weight >= TextService.BOLD_WEIGHT || IdUtil.lookup(TextService.ROLE_TO_IS_BOLD, role) === true;
    const charWidths = TextService.FONT_TO_CHAR_WIDTH[fontName];
    const charWidth = isBold ? charWidths.bold : charWidths.regular;
    const estimatedWidth = Math.max(...lines.map((line) => line.length)) * fontSize * (charWidth + tracking);
    const metrics = { isBottom: vertical === "bottom", margin, fontSize, lineHeight, lineCount: lines.length };
    const boxFill = text.box ? TextService.themeColor(context, text.box) : undefined;
    return {
      role, fontSize, anchor: alignment.anchor, x: anchorX, lines, lineHeight, weight, estimatedWidth,
      left: alignment.leftOf(anchorX, estimatedWidth),
      y: TextService.baseline(text, texts, metrics, context),
      color: text.color ? TextService.themeColor(context, text.color) : theme.text,
      blockHeight: fontSize + (lines.length - 1) * lineHeight,
      fontFamily, tracking, charWidth,
      boxStyle: text.box_style ?? (text.box ? "rect" : undefined),
      rotation: text.rotation,
      emphasis: text.emphasis,
      hasBox: Boolean(text.box ?? text.box_style),
      boxFill,
      pad: text.pad,
      radius: text.radius,
      index,
    };
  }

  private static resolveTracking(tracking?: number, fontSize = 0): number {
    if (tracking != null) {
      return tracking;
    }
    return fontSize >= TextService.TRACKING_THRESHOLD_PX ? TextService.DEFAULT_TIGHT_TRACKING : 0;
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

  private static rectOf(layout: TextLayout): TextRect {
    if (layout.boxStyle) {
      return TextService.BOX_STYLE_TO_RECT[layout.boxStyle](layout);
    }
    return TextService.rectForPlain(layout);
  }

  private static rectForPlain(layout: TextLayout): TextRect {
    const { left, y, fontSize, estimatedWidth, blockHeight } = layout;
    return {
      x0: left,
      y0: y - fontSize,
      x1: left + estimatedWidth,
      y1: y + blockHeight - fontSize * TextService.RECT_DESCENT,
      hasBox: false,
    };
  }

  private static rectForDefault(layout: TextLayout): TextRect {
    const { left, y, fontSize, estimatedWidth, blockHeight, pad } = layout;
    const padding = (pad ?? TextService.DEFAULT_PAD) * fontSize;
    return {
      x0: left - padding,
      y0: y - fontSize * TextService.BOX_ASCENT - padding * TextService.BOX_TOP_PAD,
      x1: left + estimatedWidth + padding,
      y1: y + blockHeight + fontSize * TextService.BOX_BOTTOM_EXTRA + padding * TextService.BOX_BOTTOM_PAD,
      hasBox: true,
    };
  }

  private static rectForPill(layout: TextLayout): TextRect {
    const { left, y, fontSize, estimatedWidth, blockHeight, pad } = layout;
    const padding = (pad ?? TextService.PILL_HORIZONTAL_PAD) * fontSize;
    return {
      x0: left - padding,
      y0: y - fontSize * TextService.BOX_ASCENT,
      x1: left + estimatedWidth + padding,
      y1: y + blockHeight + fontSize * TextService.BOX_BOTTOM_EXTRA,
      hasBox: true,
    };
  }

  private static rectForSticker(layout: TextLayout): TextRect {
    const { left, y, fontSize, estimatedWidth, blockHeight, pad, rotation } = layout;
    const padding = (pad ?? TextService.DEFAULT_PAD) * fontSize;
    const angle = (rotation ?? TextService.DEFAULT_STICKER_ROTATION) * TextService.DEG_TO_RAD;
    const rawWidth = estimatedWidth + padding * 2;
    const rawHeight = blockHeight + fontSize * (TextService.BOX_ASCENT + TextService.BOX_BOTTOM_EXTRA);
    const rotWidth = rawWidth * Math.cos(angle) + rawHeight * Math.abs(Math.sin(angle));
    const rotHeight = rawWidth * Math.abs(Math.sin(angle)) + rawHeight * Math.cos(angle);
    const centerX = left + estimatedWidth * TextService.HALF;
    const centerY = y + (blockHeight - fontSize) * TextService.HALF;
    return {
      x0: centerX - rotWidth * TextService.HALF,
      y0: centerY - rotHeight * TextService.HALF,
      x1: centerX + rotWidth * TextService.HALF,
      y1: centerY + rotHeight * TextService.HALF,
      hasBox: true,
    };
  }

  private static rectForHighlight(layout: TextLayout): TextRect {
    const { left, y, fontSize, estimatedWidth, blockHeight } = layout;
    const padding = fontSize * TextService.HIGHLIGHT_PAD;
    return {
      x0: left - padding,
      y0: y - fontSize * TextService.HIGHLIGHT_TOP,
      x1: left + estimatedWidth + padding,
      y1: y + blockHeight + fontSize * TextService.HIGHLIGHT_BOTTOM,
      hasBox: true,
    };
  }

  private static rectForUnderline(layout: TextLayout): TextRect {
    const { left, y, fontSize, estimatedWidth, blockHeight } = layout;
    return {
      x0: left,
      y0: y - fontSize,
      x1: left + estimatedWidth,
      y1: y + blockHeight + fontSize * TextService.UNDERLINE_Y_OFFSET,
      hasBox: true,
    };
  }

  private static boxOf(layout: TextLayout, context: CompilationContext, backdrop: string): string {
    const { color, lines, boxStyle, boxFill } = layout;
    const effectiveFill = boxFill ?? backdrop;
    const ratio = ColorUtil.contrast(color, effectiveFill);
    const isContrastIgnored = boxStyle ? TextService.STYLE_IGNORES_CONTRAST.has(boxStyle) : false;
    if (ratio < TextService.MIN_CONTRAST && !isContrastIgnored) {
      context.warnings.push(
        `text "${lines[0]}" has contrast ${ratio.toFixed(1)}:1 (min. 4.5); change 'color' or use 'box'`,
      );
    }
    if (!boxStyle) {
      return "";
    }
    const boxStyleToRenderer: Record<BoxStyle, () => string> = {
      rect: () => TextService.renderRectBox(layout, effectiveFill),
      pill: () => TextService.renderPillBox(layout, context),
      sticker: () => TextService.renderStickerBox(layout, context),
      highlight: () => TextService.renderHighlightBox(layout, context),
      underline: () => TextService.renderUnderline(layout, context),
    };
    return boxStyleToRenderer[boxStyle]();
  }

  private static renderRectBox(layout: TextLayout, fill: string): string {
    const { fontSize, left, estimatedWidth, blockHeight, y, pad, radius } = layout;
    const padding = (pad ?? TextService.DEFAULT_PAD) * fontSize;
    const boxY = y - fontSize * TextService.BOX_ASCENT - padding * TextService.BOX_TOP_PAD;
    const boxHeight = blockHeight + fontSize * TextService.BOX_BOTTOM_EXTRA + padding * TextService.BOX_BOTTOM_PAD;
    const cornerRadius = (radius ?? TextService.DEFAULT_RADIUS) * fontSize;
    return `<rect x="${(left - padding).toFixed(1)}" y="${boxY.toFixed(1)}" `
      + `width="${(estimatedWidth + padding * 2).toFixed(1)}" height="${boxHeight.toFixed(1)}" `
      + `rx="${cornerRadius.toFixed(1)}" fill="${fill}"/>`;
  }

  private static renderPillBox(layout: TextLayout, context: CompilationContext): string {
    const { fontSize, left, estimatedWidth, blockHeight, y, boxFill, pad, index } = layout;
    const fill = boxFill ?? context.theme.accent;
    const padding = (pad ?? TextService.PILL_HORIZONTAL_PAD) * fontSize;
    const boxY = y - fontSize * TextService.BOX_ASCENT;
    const boxHeight = blockHeight + fontSize * (TextService.BOX_ASCENT + TextService.PILL_VERTICAL_PAD);
    const boxWidth = estimatedWidth + padding * 2;
    const radius = boxHeight * TextService.HALF;
    const shadowDy = (fontSize * TextService.PILL_SHADOW_DY).toFixed(1);
    const shadowBlur = (fontSize * TextService.PILL_SHADOW_BLUR).toFixed(1);
    const filterId = `pill_sh_${index}`;
    return `<defs><filter id="${filterId}" x="-20%" y="-20%" width="140%" height="150%">`
      + `<feDropShadow dx="0" dy="${shadowDy}" stdDeviation="${shadowBlur}" `
      + `flood-color="#000000" flood-opacity="${TextService.PILL_SHADOW_OPACITY}"/></filter></defs>`
      + `<rect x="${(left - padding).toFixed(1)}" y="${boxY.toFixed(1)}" `
      + `width="${boxWidth.toFixed(1)}" height="${boxHeight.toFixed(1)}" `
      + `rx="${radius.toFixed(1)}" fill="${fill}" filter="url(#${filterId})"/>`;
  }

  private static renderStickerBox(layout: TextLayout, context: CompilationContext): string {
    const { fontSize, left, estimatedWidth, blockHeight, y, boxFill, pad, radius, rotation, index } = layout;
    const fill = boxFill ?? context.theme.paper;
    const padding = (pad ?? TextService.DEFAULT_PAD) * fontSize;
    const boxY = y - fontSize * TextService.BOX_ASCENT;
    const boxHeight = blockHeight + fontSize * (TextService.BOX_ASCENT + TextService.BOX_BOTTOM_EXTRA);
    const boxWidth = estimatedWidth + padding * 2;
    const cornerRadius = (radius ?? TextService.DEFAULT_RADIUS) * fontSize;
    const strokeWidth = Math.max(TextService.STICKER_MIN_STROKE, fontSize * TextService.STICKER_STROKE_FRACTION);
    const shadowDy = (fontSize * TextService.STICKER_SHADOW_DY).toFixed(1);
    const shadowBlur = (fontSize * TextService.STICKER_SHADOW_BLUR).toFixed(1);
    const filterId = `stk_sh_${index}`;
    const angle = rotation ?? TextService.DEFAULT_STICKER_ROTATION;
    const centerX = left + estimatedWidth * TextService.HALF;
    const centerY = boxY + boxHeight * TextService.HALF;
    return `<defs><filter id="${filterId}" x="-25%" y="-25%" width="150%" height="160%">`
      + `<feDropShadow dx="1" dy="${shadowDy}" stdDeviation="${shadowBlur}" `
      + `flood-color="#000000" flood-opacity="${TextService.STICKER_SHADOW_OPACITY}"/></filter></defs>`
      + `<g transform="rotate(${angle.toFixed(1)}, ${centerX.toFixed(1)}, ${centerY.toFixed(1)})">`
      + `<rect x="${(left - padding).toFixed(1)}" y="${boxY.toFixed(1)}" `
      + `width="${boxWidth.toFixed(1)}" height="${boxHeight.toFixed(1)}" `
      + `rx="${cornerRadius.toFixed(1)}" fill="${fill}" stroke="#FFFFFF" stroke-width="${strokeWidth.toFixed(1)}" `
      + `stroke-linejoin="round" filter="url(#${filterId})"/>`;
  }

  private static renderHighlightBox(layout: TextLayout, context: CompilationContext): string {
    const { fontSize, x, y, lines, lineHeight, anchor, charWidth, tracking, boxFill } = layout;
    const fill = boxFill ?? context.theme.accent;
    const pad = fontSize * TextService.HIGHLIGHT_PAD;
    const skew = fontSize * TextService.HIGHLIGHT_SKEW;
    let svg = "";
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) {
        continue;
      }
      const lineY = y + lineIndex * lineHeight;
      const lineWidth = line.length * fontSize * (charWidth + tracking);
      const lineLeft = TextService.ANCHOR_TO_LEFT_OF[anchor](x, lineWidth);
      const top = lineY - fontSize * TextService.HIGHLIGHT_TOP;
      const bottom = lineY + fontSize * TextService.HIGHLIGHT_BOTTOM;
      const points = [
        `${(lineLeft - pad + skew).toFixed(1)},${top.toFixed(1)}`,
        `${(lineLeft + lineWidth + pad + skew).toFixed(1)},${top.toFixed(1)}`,
        `${(lineLeft + lineWidth + pad - skew).toFixed(1)},${bottom.toFixed(1)}`,
        `${(lineLeft - pad - skew).toFixed(1)},${bottom.toFixed(1)}`,
      ].join(" ");
      svg += `<polygon points="${points}" fill="${fill}" fill-opacity="${TextService.HIGHLIGHT_OPACITY}"/>`;
    }
    return svg;
  }

  private static renderUnderline(layout: TextLayout, context: CompilationContext): string {
    const { fontSize, x, y, lines, lineHeight, anchor, charWidth, tracking, boxFill, emphasis } = layout;
    const stroke = boxFill ?? context.theme.accent;
    const strokeWidth = Math.max(TextService.UNDERLINE_MIN_STROKE, fontSize * TextService.UNDERLINE_STROKE_FRACTION);
    const wave = fontSize * TextService.UNDERLINE_WAVE;
    const charStep = fontSize * (charWidth + tracking);
    let svg = "";
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) {
        continue;
      }
      const lineY = y + lineIndex * lineHeight;
      const lineWidth = line.length * charStep;
      const lineLeft = TextService.ANCHOR_TO_LEFT_OF[anchor](x, lineWidth);
      const ranges = TypesettingUtil.emphasisRanges(line, emphasis);
      for (const range of ranges) {
        const startX = lineLeft + range.start * charStep;
        const endX = startX + range.length * charStep;
        const underlineY = lineY + fontSize * TextService.UNDERLINE_Y_OFFSET;
        const midX = startX + (endX - startX) * TextService.HALF;
        const path = `M ${startX.toFixed(1)} ${underlineY.toFixed(1)} `
          + `Q ${midX.toFixed(1)} ${(underlineY + wave).toFixed(1)} ${endX.toFixed(1)} ${(underlineY - 1).toFixed(1)}`;
        svg += `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth.toFixed(1)}" `
          + `stroke-linecap="round"/>`;
      }
    }
    return svg;
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
    const { x, y, fontSize, weight, color, anchor, lines, lineHeight, fontFamily, tracking, boxStyle } = layout;
    const escape = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const spans = lines.map((line, lineIndex) => {
      const dy = lineIndex === 0 ? "" : ` dy="${lineHeight.toFixed(1)}"`;
      return `<tspan x="${x.toFixed(1)}"${dy}>${escape(line)}</tspan>`;
    });
    const trackingAttr = tracking !== 0 ? ` letter-spacing="${tracking.toFixed(TextService.TRACKING_DECIMALS)}em"` : "";
    const textTag = `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${fontFamily}" `
      + `font-size="${fontSize.toFixed(1)}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}"`
      + `${trackingAttr}>${spans.join("")}</text>`;
    if (boxStyle === "sticker") {
      // Why: sticker groups enclose both the box and the text so the rotation applies to both together.
      return `${textTag}</g>`;
    }
    return textTag;
  }
}
