import type { PlaneLabel, PlaneWorld, ScreenBox } from "@/Protocols/PlaneProtocol.ts";
import type { SceneText, TextRole } from "@/Protocols/SceneProtocol.ts";
import { BoxUtil } from "@/Utils/BoxUtil.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";
import { ThemeUtil } from "@/Utils/ThemeUtil.ts";

type Align = "left" | "center" | "right";

type Edge = "top" | "bottom";

interface Alignment {
  anchor: string;
  position: (width: number, margin: number) => number;
  start: (position: number, textWidth: number) => number;
}

interface TextArea {
  content: string;
  area: ScreenBox;
  areaSize: number;
}

interface TextLayout {
  fontSize: number;
  position: number;
  baseline: number;
  alignment: Alignment;
}

const FONT = "Poppins";

export class PlaneTitleService {
  private static readonly MIN_CONTRAST = 4.5;

  private static readonly CHAR_WIDTH = 0.56;

  private static readonly MARGIN_SHARE = 0.04;

  private static readonly TITLE_SHARE = 0.06;

  private static readonly ROLE_TO_FONT_SHARE: Record<TextRole, number> = {
    title: PlaneTitleService.TITLE_SHARE, subtitle: 0.03, label: 0.035, body: 0.035,
  };

  private static readonly ROLE_TO_WEIGHT: Record<TextRole, number> = {
    title: 700, subtitle: 500, label: 500, body: 500,
  };

  private static readonly ROLE_TO_IS_TITLE: Record<TextRole, boolean> = {
    title: true, subtitle: false, label: false, body: false,
  };

  private static readonly ROLE_TO_STACKS_UNDER_TITLE: Record<TextRole, boolean> = {
    title: false, subtitle: true, label: false, body: false,
  };

  private static readonly ALIGN_TO_PLACEMENT: Record<Align, Alignment> = {
    left: { anchor: "start", position: (_width, margin) => margin, start: (position) => position },
    center: {
      anchor: "middle", position: (width) => width / 2, start: (position, textWidth) => position - textWidth / 2,
    },
    right: { anchor: "end", position: (width, margin) => width - margin, start: (position, textWidth) => position - textWidth },
  };

  private static readonly EDGE_TO_BASELINE: Record<Edge, (height: number, margin: number, size: number) => number> = {
    top: (_height, margin, fontSize) => margin + fontSize * 0.9,
    bottom: (height, margin) => height - margin * 0.7,
  };

  static draw(world: PlaneWorld, labels: readonly PlaneLabel[]): string {
    const texts = world.scene.text ?? [];
    return texts.map((text) => PlaneTitleService.drawOne(world, text, texts, labels)).join("");
  }

  private static layout(world: PlaneWorld, text: SceneText, texts: readonly SceneText[]): TextLayout {
    const { width, height } = world.camera;
    const role = text.role ?? "title";
    const fontSize = height * PlaneTitleService.ROLE_TO_FONT_SHARE[role];
    const [vertical, horizontal] = (text.at ?? "top-left").split("-");
    const margin = width * PlaneTitleService.MARGIN_SHARE;
    const alignments = PlaneTitleService.ALIGN_TO_PLACEMENT;
    const alignment = IdUtil.lookup(alignments, horizontal) ?? alignments.left;
    const baselines = PlaneTitleService.EDGE_TO_BASELINE;
    const edgeBaseline = IdUtil.lookup(baselines, vertical) ?? baselines.top;
    let baseline = edgeBaseline(height, margin, fontSize);
    const isTitle = PlaneTitleService.ROLE_TO_IS_TITLE;
    const hasTitleHere = texts.some((other) => isTitle[other.role ?? "title"] && other.at === text.at);
    if (PlaneTitleService.ROLE_TO_STACKS_UNDER_TITLE[role] && hasTitleHere) {
      baseline += height * PlaneTitleService.TITLE_SHARE * 0.9 + fontSize * 0.8;
    }
    return { fontSize, position: alignment.position(width, margin), baseline, alignment };
  }

  private static drawOne(
    world: PlaneWorld, text: SceneText, texts: readonly SceneText[], labels: readonly PlaneLabel[],
  ): string {
    const { theme, warnings } = world;
    const num = FormatUtil.oneDecimal;
    const layout = PlaneTitleService.layout(world, text, texts);
    const { fontSize, position, baseline, alignment } = layout;
    const color = ThemeUtil.resolve(theme, text.color, theme.text);
    const content = String(text.content);
    const estimatedWidth = content.length * fontSize * PlaneTitleService.CHAR_WIDTH;
    const left = alignment.start(position, estimatedWidth);
    let svg = "";
    let ratio = ColorUtil.contrast(color, theme.skyTop);
    if (text.box !== undefined && text.box !== "") {
      const fill = ThemeUtil.resolve(theme, text.box, "");
      ratio = ColorUtil.contrast(color, fill);
      svg += `<rect x="${num(left - fontSize * 0.45)}" y="${num(baseline - fontSize * 1.05)}" `
        + `width="${num(estimatedWidth + fontSize * 0.9)}" height="${num(fontSize * 1.45)}" `
        + `rx="${num(fontSize * 0.35)}" fill="${fill}"/>`;
    }
    if (ratio < PlaneTitleService.MIN_CONTRAST) {
      warnings.push(`text "${content}" has contrast ${ratio.toFixed(1)}:1 (min. 4.5)`);
    }
    const area: ScreenBox = {
      x0: left, x1: left + estimatedWidth, y0: baseline - fontSize, y1: baseline + fontSize * 0.25,
    };
    PlaneTitleService.warnCovered(world, { content, area, areaSize: estimatedWidth * fontSize }, labels);
    const weight = PlaneTitleService.ROLE_TO_WEIGHT[text.role ?? "title"];
    const escaped = SvgUtil.escapeXml(content);
    return svg + `<text x="${num(position)}" y="${num(baseline)}" font-family="${FONT}" font-size="${num(fontSize)}" `
      + `font-weight="${weight}" fill="${color}" text-anchor="${alignment.anchor}">${escaped}</text>`;
  }

  private static warnCovered(world: PlaneWorld, text: TextArea, labels: readonly PlaneLabel[]): void {
    const { content, area, areaSize } = text;
    const covered: [string, ScreenBox][] = [
      ...world.ground.map((sprite): [string, ScreenBox] => [sprite.id, sprite.bounds]),
      ...world.sky.map((sprite): [string, ScreenBox] => {
        const { screenX, screenY, width, height } = sprite;
        return [sprite.id, { x0: screenX - width / 2, x1: screenX + width / 2, y0: screenY - height, y1: screenY }];
      }),
    ];
    for (const [id, box] of covered) {
      const overlap = BoxUtil.overlapArea(area, box);
      if (overlap > 0.08 * areaSize || overlap > 0.15 * (box.x1 - box.x0) * (box.y1 - box.y0)) {
        world.warnings.push(`text "${content}" covers '${id}'`);
      }
    }
    for (const label of labels) {
      if (BoxUtil.overlapArea(area, label.box) > 0) {
        world.warnings.push(`text "${content}" covers the label '${label.title}'`);
      }
    }
  }
}
