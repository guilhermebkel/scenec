import type { Theme } from "@/Protocols/ThemeProtocol.ts";

type Triple = [number, number, number];

export class RecolorUtil {
  private static readonly DEFAULT_STRENGTH = 0.75;

  private static readonly COLOR_ATTRIBUTE = /(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,6})"/g;

  private static readonly MIN_SWATCH_CHROMA = 12;

  private static readonly GRAY_CHROMA = 10;

  private static readonly NEUTRAL_PULL = 0.5;

  private static readonly LIGHTNESS_PULL = 0.4;

  private static readonly HUE_WEIGHT = 2;

  private static readonly CHROMA_DISTANCE_SCALE = 60;

  private static readonly CHANNEL_MAX = 255;

  private static readonly SRGB_KNEE = 0.04045;

  private static readonly SRGB_LINEAR_SLOPE = 12.92;

  private static readonly SRGB_INVERSE_KNEE = 0.0031308;

  private static readonly SRGB_OFFSET = 0.055;

  private static readonly SRGB_GAMMA_DIVISOR = 1.055;

  private static readonly SRGB_GAMMA = 2.4;

  private static readonly LAB_EPSILON = 0.008856;

  private static readonly LAB_SLOPE = 7.787;

  private static readonly LAB_OFFSET = 16 / 116;

  private static readonly LIGHTNESS_SCALE = 116;

  private static readonly LIGHTNESS_SHIFT = 16;

  private static readonly A_SCALE = 500;

  private static readonly B_SCALE = 200;

  private static readonly WHITE_X = 0.95047;

  private static readonly WHITE_Z = 1.08883;

  private static readonly RGB_TO_XYZ: Triple[] = [
    [0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505],
  ];

  private static readonly XYZ_TO_RGB: Triple[] = [
    [3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.204, 1.057],
  ];

  static makeRecolor(theme: Theme, strength = RecolorUtil.DEFAULT_STRENGTH): (svg: string) => string {
    // Why: the returned function moves the colors of an SVG toward the theme palette, keeping their relative lightness.
    const base = [theme.primary, theme.secondary, theme.accent, ...theme.foliage];
    const colors = [...base, theme.trunk, theme.wood, theme.glass];
    const swatches = colors
      .filter((color) => color.startsWith("#"))
      .map((color) => RecolorUtil.hexToLch(color))
      .filter((swatch) => swatch[1] > RecolorUtil.MIN_SWATCH_CHROMA);
    const neutral = RecolorUtil.toLab(RecolorUtil.toRgb(theme.metal));
    const hexToRecolored = new Map<string, string>();
    const recolorOne = (hex: string): string => {
      const cached = hexToRecolored.get(hex);
      if (cached) {
        return cached;
      }
      const recolored = RecolorUtil.recolorColor(hex, { swatches, neutral, strength });
      hexToRecolored.set(hex, recolored);
      return recolored;
    };
    return (svg) => svg.replace(
      RecolorUtil.COLOR_ATTRIBUTE,
      (_match, attribute: string, color: string) => `${attribute}="${recolorOne(color)}"`,
    );
  }

  private static hexToLch(hex: string): Triple {
    const rgb = RecolorUtil.toRgb(hex);
    return RecolorUtil.toLch(RecolorUtil.toLab(rgb));
  }

  private static recolorColor(hex: string, palette: { swatches: Triple[]; neutral: Triple; strength: number }): string {
    const { swatches, neutral, strength } = palette;
    const lab = RecolorUtil.toLab(RecolorUtil.toRgb(hex));
    const [lightness, chroma, hue] = RecolorUtil.toLch(lab);
    if (chroma < RecolorUtil.GRAY_CHROMA) {
      // Why: a gray moves slightly toward the theme's neutral instead of taking a hue.
      const pull = strength * RecolorUtil.NEUTRAL_PULL;
      return RecolorUtil.fromLab([
        lightness,
        lab[1] * (1 - strength) + neutral[1] * pull,
        lab[2] * (1 - strength) + neutral[2] * pull,
      ]);
    }
    const best = RecolorUtil.nearestSwatch(swatches, chroma, hue);
    if (!best) {
      return hex;
    }
    const newHue = Math.atan2(
      Math.sin(hue) * (1 - strength) + Math.sin(best[2]) * strength,
      Math.cos(hue) * (1 - strength) + Math.cos(best[2]) * strength,
    );
    const newChroma = chroma * (1 - strength) + Math.min(chroma, best[1]) * strength;
    const lightnessPull = strength * RecolorUtil.LIGHTNESS_PULL;
    const newLightness = lightness * (1 - lightnessPull) + best[0] * lightnessPull;
    return RecolorUtil.fromLab([newLightness, newChroma * Math.cos(newHue), newChroma * Math.sin(newHue)]);
  }

  private static nearestSwatch(swatches: Triple[], chroma: number, hue: number): Triple | undefined {
    let best: Triple | undefined = swatches[0];
    let bestDistance = Infinity;
    for (const swatch of swatches) {
      const hueGap = Math.atan2(Math.sin(hue - swatch[2]), Math.cos(hue - swatch[2]));
      const hueDistance = Math.abs(hueGap);
      const chromaDistance = Math.abs(chroma - swatch[1]) / RecolorUtil.CHROMA_DISTANCE_SCALE;
      const distance = hueDistance * RecolorUtil.HUE_WEIGHT + chromaDistance;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = swatch;
      }
    }
    return best;
  }

  private static toRgb(hex: string): Triple {
    let digits = hex.replace("#", "");
    if (digits.length === 3) {
      digits = Array.from(digits, (char) => char + char).join("");
    }
    const channel = (start: number): number => {
      return parseInt(digits.slice(start, start + 2), 16) / RecolorUtil.CHANNEL_MAX;
    };
    return [channel(0), channel(2), channel(4)];
  }

  private static linearize(channel: number): number {
    return channel <= RecolorUtil.SRGB_KNEE
      ? channel / RecolorUtil.SRGB_LINEAR_SLOPE
      : ((channel + RecolorUtil.SRGB_OFFSET) / RecolorUtil.SRGB_GAMMA_DIVISOR) ** RecolorUtil.SRGB_GAMMA;
  }

  private static delinearize(channel: number): number {
    return channel <= RecolorUtil.SRGB_INVERSE_KNEE
      ? RecolorUtil.SRGB_LINEAR_SLOPE * channel
      : RecolorUtil.SRGB_GAMMA_DIVISOR * channel ** (1 / RecolorUtil.SRGB_GAMMA) - RecolorUtil.SRGB_OFFSET;
  }

  private static multiply(matrix: Triple[], vector: Triple): Triple {
    const [row0 = [0, 0, 0], row1 = [0, 0, 0], row2 = [0, 0, 0]] = matrix;
    const dot = (row: number[]): number => (
      (row[0] ?? 0) * vector[0] + (row[1] ?? 0) * vector[1] + (row[2] ?? 0) * vector[2]
    );
    return [dot(row0), dot(row1), dot(row2)];
  }

  private static toLab(rgb: Triple): Triple {
    const [red, green, blue] = rgb;
    const linear: Triple = [RecolorUtil.linearize(red), RecolorUtil.linearize(green), RecolorUtil.linearize(blue)];
    const [rawX, tristimulusY, rawZ] = RecolorUtil.multiply(RecolorUtil.RGB_TO_XYZ, linear);
    const relativeX = rawX / RecolorUtil.WHITE_X;
    const relativeZ = rawZ / RecolorUtil.WHITE_Z;
    const curve = (value: number): number => (
      value > RecolorUtil.LAB_EPSILON ? Math.cbrt(value) : RecolorUtil.LAB_SLOPE * value + RecolorUtil.LAB_OFFSET
    );
    return [
      RecolorUtil.LIGHTNESS_SCALE * curve(tristimulusY) - RecolorUtil.LIGHTNESS_SHIFT,
      RecolorUtil.A_SCALE * (curve(relativeX) - curve(tristimulusY)),
      RecolorUtil.B_SCALE * (curve(tristimulusY) - curve(relativeZ)),
    ];
  }

  private static fromLab(lab: Triple): string {
    const [lightness, greenRed, blueYellow] = lab;
    const fy = (lightness + RecolorUtil.LIGHTNESS_SHIFT) / RecolorUtil.LIGHTNESS_SCALE;
    const fx = fy + greenRed / RecolorUtil.A_SCALE;
    const fz = fy - blueYellow / RecolorUtil.B_SCALE;
    const inverse = (value: number): number => (
      value ** 3 > RecolorUtil.LAB_EPSILON ? value ** 3 : (value - RecolorUtil.LAB_OFFSET) / RecolorUtil.LAB_SLOPE
    );
    const xyz: Triple = [inverse(fx) * RecolorUtil.WHITE_X, inverse(fy), inverse(fz) * RecolorUtil.WHITE_Z];
    const rgb = RecolorUtil.multiply(RecolorUtil.XYZ_TO_RGB, xyz);
    const hex = rgb.map((channel) => {
      const encoded = RecolorUtil.delinearize(channel);
      const clamped = Math.min(1, Math.max(0, encoded));
      return Math.round(clamped * RecolorUtil.CHANNEL_MAX).toString(16).padStart(2, "0");
    });
    return `#${hex.join("")}`;
  }

  private static toLch(lab: Triple): Triple {
    return [lab[0], Math.hypot(lab[1], lab[2]), Math.atan2(lab[2], lab[1])];
  }
}
