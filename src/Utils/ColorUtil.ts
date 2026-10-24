export class ColorUtil {
  // Color helpers shared by every layer.

  /** Darkens (k < 0) or lightens (k > 0) a hex color by mixing it with black or white. */
  static sh(hex: string, k: number): string {
    if (!hex.startsWith("#")) {
      return hex;
    }
    let digits = hex.slice(1);
    if (digits.length === 3) {
      digits = [...digits].map((char) => char + char).join("");
    }
    const channels = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
    const target = k < 0 ? 0 : 255;
    const amount = Math.abs(k);
    return "#" + channels.map((v) => Math.round(v + (target - v) * amount).toString(16).padStart(2, "0")).join("");
  }

  static luminance(hex: string): number {
    let digits = hex.replace("#", "");
    if (digits.length === 3) {
      digits = [...digits].map((char) => char + char).join("");
    }
    const pairs = (/^[0-9a-f]{6}$/i.exec(digits)) ? digits.match(/.{2}/g) : null;
    if (!pairs) {
      return 1;
    }
    const [rr = 0, gg = 0, bb = 0] = pairs.map((x) => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  }

  /** WCAG contrast ratio between two hex colors. */
  static contrast(a: string, b: string): number {
    const [l1 = 0, l2 = 0] = [ColorUtil.luminance(a), ColorUtil.luminance(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  }
}
