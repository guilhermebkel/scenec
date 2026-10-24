import type { PersonParams, Point } from "@/Protocols/PersonProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { PersonArmUtil } from "@/Utils/PersonArmUtil.ts";

interface Face {
  side: number;
  isBack: boolean;
  gaze: Point;
}

interface HairParts {
  backHair: string;
  front: string;
}

type HairBuilder = (hair: string, side: number) => HairParts;

type FeatureBuilder = (x: number, cy: number, color: string) => string;

export class PersonHeadUtil {
  static readonly SKIN_TONES: Record<string, string> = { light: "#F2C9A5", medium: "#D19A6E", tan: "#B87A50", dark: "#7A4B30", deep: "#5A3522" };

  static readonly HAIR_COLORS: Record<string, string> = { black: "#1E1A1A", brown: "#5A3825", blonde: "#E2B45A", red: "#B0462A", gray: "#9C9C9C" };

  static readonly EXPRESSION_NAMES = ["happy", "neutral", "surprised", "sad", "worried", "angry", "laughing", "wink", "thinking"];

  private static readonly CENTER_Y = -91;

  private static readonly SHORT_FRONT = (hair: string): string => `<path d="M-11 -93 Q-10 -104 1 -103 Q11 -102 11 -94 Q6 -98 -2 -97 Q-7 -96 -11 -93 Z" fill="${hair}"/>`;

  private static readonly FRINGE = (hair: string): string => `<path d="M-11.5 -92 Q-11 -104 0 -103.5 Q11 -104 11.5 -92 Q2 -100 -11.5 -92 Z" fill="${hair}"/>`;

  private static readonly CURL_OFFSETS: Point[] = [[-9, -6], [-4, -10], [2, -11], [8, -8], [11, -2], [-11, 0]];

  private static readonly STYLE_TO_HAIR: Record<string, HairBuilder> = {
    long: (hair) => ({
      backHair: `<path d="M-12 -93 Q-15 -70 -10 -68 L10 -68 Q15 -70 12 -93 Z" fill="${hair}"/>`,
      front: `<path d="M-12 -92 Q-11 -105 0 -104 Q11 -105 12 -92 Q4 -99 -12 -92 Z" fill="${hair}"/>`,
    }),
    bun: (hair) => ({ backHair: `<circle cx="0" cy="-105" r="6" fill="${hair}"/>`, front: PersonHeadUtil.FRINGE(hair) }),
    curly: (hair) => ({
      backHair: "",
      front: PersonHeadUtil.CURL_OFFSETS.map(([offsetX, offsetY]) => `<circle cx="${0 + offsetX}" cy="${PersonHeadUtil.CENTER_Y + offsetY}" r="5" fill="${hair}"/>`).join(""),
    }),
    ponytail: (hair, side) => {
      const flat = side ? 0 : 1;
      return {
        backHair: `<path d="M${-side * 9 - flat * 9} -96 Q${-side * 22 - flat * 14} -86 ${-side * 15 - flat * 12} -72" stroke="${hair}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
        front: PersonHeadUtil.FRINGE(hair),
      };
    },
    short: (hair) => ({ backHair: "", front: PersonHeadUtil.SHORT_FRONT(hair) }),
    bald: () => ({ backHair: "", front: "" }),
  };

  private static readonly EXPRESSION_TO_MOUTH: Record<string, FeatureBuilder> = {
    surprised: (x, cy, ink) => `<ellipse cx="${x}" cy="${cy + 5.5}" rx="1.6" ry="2" fill="${ink}"/>`,
    neutral: (x, cy, ink) => `<path d="M${x - 2.5} ${cy + 5.5} L${x + 2.5} ${cy + 5.5}" stroke="${ink}" stroke-width="1.2" stroke-linecap="round"/>`,
    sad: (x, cy, ink) => PersonHeadUtil.frown(x, cy, ink),
    worried: (x, cy, ink) => PersonHeadUtil.frown(x, cy, ink),
    angry: (x, cy, ink) => PersonHeadUtil.frown(x, cy, ink),
    laughing: (x, cy, ink) => `<path d="M${x - 3.5} ${cy + 4} Q${x} ${cy + 9.5} ${x + 3.5} ${cy + 4} Z" fill="${ink}"/>`,
  };

  private static readonly EXPRESSION_TO_BROWS: Record<string, FeatureBuilder> = {
    thinking: (x, cy, hair) => PersonHeadUtil.raisedBrows(x, cy, hair),
    surprised: (x, cy, hair) => PersonHeadUtil.raisedBrows(x, cy, hair),
    worried: (x, cy, hair) => `<path d="M${-6 + x} ${cy - 4.2} L${-2 + x} ${cy - 5.6} M${2 + x} ${cy - 5.6} L${6 + x} ${cy - 4.2}" stroke="${hair}" stroke-width="1.1" stroke-linecap="round"/>`,
    angry: (x, cy, hair) => `<path d="M${-6 + x} ${cy - 5.6} L${-2 + x} ${cy - 4} M${2 + x} ${cy - 4} L${6 + x} ${cy - 5.6}" stroke="${hair}" stroke-width="1.3" stroke-linecap="round"/>`,
  };

  private static frown(x: number, cy: number, ink: string): string {
    return `<path d="M${x - 3} ${cy + 6.5} Q${x} ${cy + 3.8} ${x + 3} ${cy + 6.5}" stroke="${ink}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  }

  private static smile(x: number, cy: number, ink: string): string {
    return `<path d="M${x - 3} ${cy + 4.5} Q${x} ${cy + 7.5} ${x + 3} ${cy + 4.5}" stroke="${ink}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  }

  private static raisedBrows(x: number, cy: number, hair: string): string {
    return `<path d="M${-6 + x} ${cy - 4.5} L${-2 + x} ${cy - 5.2} M${2 + x} ${cy - 5.2} L${6 + x} ${cy - 4.5}" stroke="${hair}" stroke-width="1.1" stroke-linecap="round"/>`;
  }

  static skinOf(name: string | undefined): string {
    return PersonHeadUtil.SKIN_TONES[name ?? ""] ?? PersonHeadUtil.SKIN_TONES.medium ?? "";
  }

  private static hairColorOf(params: PersonParams): string {
    const named = PersonHeadUtil.HAIR_COLORS[params.hair_color ?? ""];
    const fallback = PersonHeadUtil.HAIR_COLORS[params.age === "elder" ? "gray" : "brown"] ?? "";
    return named ?? (params.hair_color || fallback);
  }

  static head(params: PersonParams, theme: Theme, face: Face): string {
    const { side, isBack, gaze } = face;
    const skin = PersonHeadUtil.skinOf(params.skin);
    const hair = PersonHeadUtil.hairColorOf(params);
    const style = params.hair || "short";
    const { backHair, front } = PersonHeadUtil.STYLE_TO_HAIR[style]?.(hair, side) ?? { backHair: "", front: "" };
    const neck = `<rect x="-3" y="-85" width="6" height="7" fill="${ColorUtil.sh(skin, -0.12)}"/>`;
    if (isBack) {
      return neck + backHair + PersonHeadUtil.backOfHead(style, skin, hair);
    }
    const cy = PersonHeadUtil.CENTER_Y;
    const ear = side ? `<ellipse cx="${-side * 10}" cy="${cy + 1}" rx="2" ry="3" fill="${ColorUtil.sh(skin, -0.08)}"/>` : "";
    return neck + backHair + ear + `<circle cx="0" cy="${cy}" r="11" fill="${skin}"/>`
      + front + PersonHeadUtil.faceFeatures(params, theme, { side, gaze, hair, skin });
  }

  // Why: seen from behind the hair covers the head and there is no face.
  private static backOfHead(style: string, skin: string, hair: string): string {
    const cy = PersonHeadUtil.CENTER_Y;
    const scalp = `<circle cx="0" cy="${cy}" r="11" fill="${skin}"/>`;
    if (style === "bald") {
      return scalp;
    }
    const longHair = style === "long" ? `<path d="M-11 -90 Q-13 -70 -9 -68 L9 -68 Q13 -70 11 -90 Z" fill="${hair}"/>` : "";
    const bun = style === "bun" ? `<circle cx="0" cy="-104" r="6" fill="${hair}"/>` : "";
    return `${scalp}<path d="M-11.3 -88 Q-12 -103 0 -103 Q12 -103 11.3 -88 Q0 -84 -11.3 -88 Z" fill="${hair}"/>${longHair}${bun}`;
  }

  private static faceFeatures(params: PersonParams, theme: Theme, look: { side: number; gaze: Point; hair: string; skin: string }): string {
    const { side, gaze, hair, skin } = look;
    const cy = PersonHeadUtil.CENTER_Y;
    const expression = params.expr || "happy";
    // Why: looking sideways in the front view also shifts the face, so the head seems to turn a little.
    const shiftX = side * 1.8 + (side ? 0 : gaze[0] * 1.3);
    const mouthX = side * 2 + (side ? 0 : gaze[0] * 1.3);
    const mouth = (PersonHeadUtil.EXPRESSION_TO_MOUTH[expression] ?? PersonHeadUtil.smile)(mouthX, cy, theme.ink);
    const brows = PersonHeadUtil.EXPRESSION_TO_BROWS[expression]?.(shiftX, cy, hair) ?? "";
    const blush = `<circle cx="${-6.5 + shiftX}" cy="${cy + 3.5}" r="2" fill="#E9806E" opacity="0.35"/><circle cx="${6.5 + shiftX}" cy="${cy + 3.5}" r="2" fill="#E9806E" opacity="0.35"/>`;
    const glasses = params.glasses
      ? `<g stroke="${theme.ink}" stroke-width="1" fill="none"><circle cx="${-4 + shiftX}" cy="${cy}" r="3.2"/><circle cx="${4 + shiftX}" cy="${cy}" r="3.2"/><path d="M${-0.8 + shiftX} ${cy} L${0.8 + shiftX} ${cy}"/></g>`
      : "";
    const beard = params.beard
      ? `<path d="M-10 -89 Q-10 -76 0 -76 Q10 -76 10 -89 Q8 -83 ${mouthX + 4} ${cy + 3} L${mouthX - 4} ${cy + 3} Q-8 -83 -10 -89 Z" fill="${hair}"/>`
      : "";
    return beard + PersonHeadUtil.ageLines(params, skin, shiftX) + PersonHeadUtil.eyes(expression, theme, { shiftX, gaze }) + brows + mouth + blush + glasses;
  }

  private static ageLines(params: PersonParams, skin: string, shiftX: number): string {
    if (params.age !== "elder") {
      return "";
    }
    const round = PersonArmUtil.round;
    const cy = PersonHeadUtil.CENTER_Y;
    return `<path d="M${round(-8.2 + shiftX)} ${cy - 1.5} l-1.4 -0.6 M${round(8.2 + shiftX)} ${cy - 1.5} l1.4 -0.6 M${round(-5 + shiftX)} ${cy - 7.5} L${round(5 + shiftX)} ${cy - 7.5}" stroke="${ColorUtil.sh(skin, -0.25)}" stroke-width="0.6" stroke-linecap="round"/>`;
  }

  private static eyes(expression: string, theme: Theme, look: { shiftX: number; gaze: Point }): string {
    const round = PersonArmUtil.round;
    const { shiftX, gaze } = look;
    const cy = PersonHeadUtil.CENTER_Y;
    const pupilX = gaze[0] * 1.1;
    const pupilY = gaze[1] * 1.1;
    const eye = (x: number): string => `<circle cx="${round(x + pupilX)}" cy="${round(cy + pupilY)}" r="1.45" fill="${theme.ink}"/><circle cx="${round(x + pupilX + 0.45)}" cy="${round(cy + pupilY - 0.5)}" r="0.42" fill="#FFFFFF" opacity="0.85"/>`;
    if (expression === "wink") {
      return eye(-4 + shiftX) + `<path d="M${round(2.4 + shiftX)} ${cy} Q${round(4 + shiftX)} ${cy - 1.6} ${round(5.6 + shiftX)} ${cy}" stroke="${theme.ink}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
    }
    return eye(-4 + shiftX) + eye(4 + shiftX);
  }
}
