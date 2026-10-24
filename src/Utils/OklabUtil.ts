export type Lab = readonly [number, number, number];

export type Rgb = readonly [number, number, number];

export class OklabUtil {
  private static readonly CHANNEL_MAX = 255;

  private static readonly GAMMA_KNEE = 0.04045;

  private static readonly GAMMA_LINEAR_DIVISOR = 12.92;

  private static readonly GAMMA_OFFSET = 0.055;

  private static readonly GAMMA_DIVISOR = 1.055;

  private static readonly GAMMA_EXPONENT = 2.4;

  private static readonly HEX_RADIX = 16;

  private static readonly HEX_DIGITS = 2;

  private static readonly HEX_CHANNEL_STARTS = [1, 3, 5] as const;

  private static readonly RGB_TO_CONE: readonly Lab[] = [
    [0.4122214708, 0.5363325363, 0.0514459929],
    [0.2119034982, 0.6806995451, 0.1073969566],
    [0.0883024619, 0.2817188376, 0.6299787005],
  ];

  private static readonly CONE_TO_LAB: readonly Lab[] = [
    [0.2104542553, 0.793617785, -0.0040720468],
    [1.9779984951, -2.428592205, 0.4505937099],
    [0.0259040371, 0.7827717662, -0.808675766],
  ];

  private static readonly CHANNEL_TO_LINEAR = Float32Array.from(
    { length: OklabUtil.CHANNEL_MAX + 1 },
    (_, channel) => OklabUtil.linearOf(channel),
  );

  static fromRgb(red: number, green: number, blue: number): Lab {
    const linear: Lab = [OklabUtil.linear(red), OklabUtil.linear(green), OklabUtil.linear(blue)];
    const [longCone = 0, mediumCone = 0, shortCone = 0] = OklabUtil.RGB_TO_CONE.map(
      (row) => Math.cbrt(OklabUtil.dot(row, linear)),
    );
    const cones: Lab = [longCone, mediumCone, shortCone];
    const [lightness = 0, greenRed = 0, blueYellow = 0] = OklabUtil.CONE_TO_LAB.map((row) => OklabUtil.dot(row, cones));
    return [lightness, greenRed, blueYellow];
  }

  static distance(first: Lab, second: Lab): number {
    return Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]);
  }

  static toHex(red: number, green: number, blue: number): string {
    const digits = [red, green, blue].map(
      (channel) => Math.round(channel).toString(OklabUtil.HEX_RADIX).padStart(OklabUtil.HEX_DIGITS, "0"),
    );
    return `#${digits.join("").toUpperCase()}`;
  }

  static rgbOfHex(hex: string): Rgb {
    const [red = 0, green = 0, blue = 0] = OklabUtil.HEX_CHANNEL_STARTS.map(
      (start) => Number.parseInt(hex.slice(start, start + OklabUtil.HEX_DIGITS), OklabUtil.HEX_RADIX),
    );
    return [red, green, blue];
  }

  private static dot(row: Lab, vector: Lab): number {
    return row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2];
  }

  private static linear(channel: number): number {
    return OklabUtil.CHANNEL_TO_LINEAR[channel] ?? 0;
  }

  private static linearOf(channel: number): number {
    const unit = channel / OklabUtil.CHANNEL_MAX;
    return unit <= OklabUtil.GAMMA_KNEE
      ? unit / OklabUtil.GAMMA_LINEAR_DIVISOR
      : ((unit + OklabUtil.GAMMA_OFFSET) / OklabUtil.GAMMA_DIVISOR) ** OklabUtil.GAMMA_EXPONENT;
  }
}
