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

  /** Darkens (amount < 0) or lightens (amount > 0) a hex color by mixing it with black or white. */
  static sh(hex: string, amount: number): string {
    if (!hex.startsWith("#")) {
      return hex;
    }
    const channels = ColorUtil.channelsOf(hex.slice(1));
    const target = amount < 0 ? 0 : ColorUtil.CHANNEL_MAX;
    const strength = Math.abs(amount);
    return `#${channels.map((value) => Math.round(value + (target - value) * strength).toString(ColorUtil.HEX_RADIX).padStart(2, "0")).join("")}`;
  }

  private static expand(digits: string): string {
    return digits.length === 3 ? [...digits].map((char) => char + char).join("") : digits;
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
    const [red = 0, green = 0, blue = 0] = ColorUtil.channelsOf(digits).map((value) => ColorUtil.linearize(value / ColorUtil.CHANNEL_MAX));
    return ColorUtil.RED_WEIGHT * red + ColorUtil.GREEN_WEIGHT * green + ColorUtil.BLUE_WEIGHT * blue;
  }

  /** WCAG contrast ratio between two hex colors. */
  static contrast(first: string, second: string): number {
    const [lighter = 0, darker = 0] = [ColorUtil.luminance(first), ColorUtil.luminance(second)].sort((left, right) => right - left);
    return (lighter + ColorUtil.CONTRAST_FLARE) / (darker + ColorUtil.CONTRAST_FLARE);
  }
}
