import { OklabUtil } from "@/Utils/OklabUtil.ts";

export class ColorUtil {
  private static readonly HEX_RADIX = 16;

  private static readonly CHANNEL_MAX = 255;

  private static readonly CHANNEL_STARTS = [0, 2, 4];

  private static readonly SRGB_KNEE = 0.03928;

  private static readonly SRGB_LINEAR_SLOPE = 12.92;

  private static readonly SRGB_OFFSET = 0.055;

  private static readonly SRGB_GAMMA_DIVISOR = 1.055;

  private static readonly SRGB_GAMMA = 2.4;

  private static readonly RED_WEIGHT = 0.2126;

  private static readonly GREEN_WEIGHT = 0.7152;

  private static readonly BLUE_WEIGHT = 0.0722;

  private static readonly CONTRAST_FLARE = 0.05;

  private static readonly SHADOW_L_FACTOR = 0.85;

  private static readonly LIGHT_L_FACTOR = 0.85;

  private static readonly SHADOW_HUE_TARGET = 4.6;

  private static readonly LIGHT_HUE_TARGET = 1.4;

  private static readonly SHADOW_HUE_PULL = 0.55;

  private static readonly LIGHT_HUE_PULL = 0.35;

  private static readonly SHADOW_CHROMA_FACTOR = 0.35;

  private static readonly LIGHT_CHROMA_FACTOR = 0.6;

  private static readonly CHROMA_SCALE_MAX = 0.04;

  private static readonly FULL_TURN = Math.PI * 2;

  private static readonly HALF_TURN = Math.PI;

  static sh(hex: string, amount: number): string {
    // Why: shades in OKLCH: amount < 0 shifts hue toward cool and raises chroma; amount > 0 shifts toward warm and lowers chroma.
    if (!hex.startsWith("#")) {
      return hex;
    }
    const full = ColorUtil.expand(hex.slice(1));
    if (!/^[0-9a-f]{6}$/i.test(full)) {
      return hex;
    }
    const [red = 0, green = 0, blue = 0] = ColorUtil.channelsOf(full);
    const lab = OklabUtil.fromRgb(red, green, blue);
    const [lightness, chroma, hue] = OklabUtil.labToLch(lab);
    const strength = Math.min(1, Math.abs(amount));
    const chromaScale = Math.min(1, chroma / ColorUtil.CHROMA_SCALE_MAX);
    if (amount < 0) {
      const targetL = Math.max(0, lightness * (1 - ColorUtil.SHADOW_L_FACTOR * strength));
      const targetH = ColorUtil.rotateHue(
        hue, ColorUtil.SHADOW_HUE_TARGET, ColorUtil.SHADOW_HUE_PULL * strength * chromaScale,
      );
      const targetC = chroma * (1 + ColorUtil.SHADOW_CHROMA_FACTOR * strength);
      return OklabUtil.lchToHex([targetL, targetC, targetH]);
    }
    const targetL = Math.min(1, lightness + (1 - lightness) * (ColorUtil.LIGHT_L_FACTOR * strength));
    const targetH = ColorUtil.rotateHue(
      hue, ColorUtil.LIGHT_HUE_TARGET, ColorUtil.LIGHT_HUE_PULL * strength * chromaScale,
    );
    const targetC = chroma * (1 - ColorUtil.LIGHT_CHROMA_FACTOR * strength);
    return OklabUtil.lchToHex([targetL, targetC, targetH]);
  }

  private static rotateHue(current: number, target: number, weight: number): number {
    let diff = (target - current) % ColorUtil.FULL_TURN;
    if (diff > ColorUtil.HALF_TURN) {
      diff -= ColorUtil.FULL_TURN;
    } else if (diff < -ColorUtil.HALF_TURN) {
      diff += ColorUtil.FULL_TURN;
    }
    return (current + diff * weight + ColorUtil.FULL_TURN) % ColorUtil.FULL_TURN;
  }

  private static toHexChannel(value: number): string {
    const clamped = Math.min(ColorUtil.CHANNEL_MAX, Math.max(0, value));
    const raw = clamped.toString(ColorUtil.HEX_RADIX);
    return raw.padStart(2, "0");
  }

  static mix(first: string, second: string, weight: number): string {
    const firstDigits = ColorUtil.expand(first.replace("#", ""));
    const secondDigits = ColorUtil.expand(second.replace("#", ""));
    if (!/^[0-9a-f]{6}$/i.test(firstDigits) || !/^[0-9a-f]{6}$/i.test(secondDigits)) {
      return first;
    }
    const factor = Math.min(1, Math.max(0, weight));
    const inverse = 1 - factor;
    const [r1 = 0, g1 = 0, b1 = 0] = ColorUtil.channelsOf(firstDigits);
    const [r2 = 0, g2 = 0, b2 = 0] = ColorUtil.channelsOf(secondDigits);
    const red = Math.round(r1 * inverse + r2 * factor);
    const green = Math.round(g1 * inverse + g2 * factor);
    const blue = Math.round(b1 * inverse + b2 * factor);
    return `#${ColorUtil.toHexChannel(red)}${ColorUtil.toHexChannel(green)}${ColorUtil.toHexChannel(blue)}`;
  }

  private static expand(digits: string): string {
    return digits.length === 3 ? Array.from(digits, (char) => char + char).join("") : digits;
  }

  private static channelsOf(digits: string): number[] {
    const full = ColorUtil.expand(digits);
    return ColorUtil.CHANNEL_STARTS.map((start) => parseInt(full.slice(start, start + 2), ColorUtil.HEX_RADIX));
  }

  private static linearize(channel: number): number {
    return channel <= ColorUtil.SRGB_KNEE
      ? channel / ColorUtil.SRGB_LINEAR_SLOPE
      : ((channel + ColorUtil.SRGB_OFFSET) / ColorUtil.SRGB_GAMMA_DIVISOR) ** ColorUtil.SRGB_GAMMA;
  }

  static luminance(hex: string): number {
    const digits = ColorUtil.expand(hex.replace("#", ""));
    if (!/^[0-9a-f]{6}$/i.test(digits)) {
      return 1;
    }
    const linear = ColorUtil.channelsOf(digits).map((value) => ColorUtil.linearize(value / ColorUtil.CHANNEL_MAX));
    const [red = 0, green = 0, blue = 0] = linear;
    return ColorUtil.RED_WEIGHT * red + ColorUtil.GREEN_WEIGHT * green + ColorUtil.BLUE_WEIGHT * blue;
  }

  static contrast(first: string, second: string): number {
    // Why: this is the WCAG contrast ratio between two hex colors, lighter over darker.
    const luminances = [ColorUtil.luminance(first), ColorUtil.luminance(second)];
    const [lighter = 0, darker = 0] = luminances.sort((left, right) => right - left);
    return (lighter + ColorUtil.CONTRAST_FLARE) / (darker + ColorUtil.CONTRAST_FLARE);
  }
}
