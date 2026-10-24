
export class RecolorUtil {
  // Recolore um SVG importado para a paleta do tema, preservando a luminosidade relativa.
// Cada cor é levada para o swatch do tema de matiz mais próximo; cinzas viram neutros do tema.
  private static readonly hex2rgb = (h: any) => { h = h.replace("#", ""); if (h.length === 3) { h = [...h].map((c) => c + c).join(""); } return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };

  private static readonly lin = (c: any) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

  private static readonly delin = (c: any) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

  private static rgb2lab([r, g, b]: number[]) {
    [r, g, b] = [r, g, b].map(RecolorUtil.lin);
    const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, y = 0.2126 * r + 0.7152 * g + 0.0722 * b, z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
    const f = (t: any) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  }

  private static lab2hex([L, a, b]: number[]) {
    const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
    const inv = (t: any) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
    const [x, y, z] = [inv(fx) * 0.95047, inv(fy), inv(fz) * 1.08883];
    const rgb = [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.204 * y + 1.057 * z];
    return "#" + rgb.map((c) => Math.round(Math.min(1, Math.max(0, RecolorUtil.delin(c))) * 255).toString(16).padStart(2, "0")).join("");
  }

  private static readonly lch = ([L, a, b]: number[]) => [L, Math.hypot(a, b), Math.atan2(b, a)];

  static makeRecolor(theme: any, strength = 0.75) {
    const swatches = [theme.primary, theme.secondary, theme.accent, ...theme.foliage, theme.trunk, theme.wood, theme.glass]
      .filter((c) => c?.startsWith("#")).map((c) => RecolorUtil.lch(RecolorUtil.rgb2lab(RecolorUtil.hex2rgb(c)))).filter((s) => s[1] > 12);
    const neutral = RecolorUtil.rgb2lab(RecolorUtil.hex2rgb(theme.metal));
    const cache = new Map();
    const map = (hex: any) => {
      if (cache.has(hex)) { return cache.get(hex); }
      const lab = RecolorUtil.rgb2lab(RecolorUtil.hex2rgb(hex)); const [L, C, H] = RecolorUtil.lch(lab);
      let out;
      if (C < 10) { // cinza: puxa levemente para o neutro do tema
        out = RecolorUtil.lab2hex([L, lab[1] * (1 - strength) + neutral[1] * strength * 0.5, lab[2] * (1 - strength) + neutral[2] * strength * 0.5]);
      } else {
        let best = swatches[0], bd = Infinity;
        for (const s of swatches) { const dh = Math.abs(Math.atan2(Math.sin(H - s[2]), Math.cos(H - s[2]))); const d = dh * 2 + Math.abs(C - s[1]) / 60; if (d < bd) { bd = d; best = s; } }
        const nH = Math.atan2(Math.sin(H) * (1 - strength) + Math.sin(best[2]) * strength, Math.cos(H) * (1 - strength) + Math.cos(best[2]) * strength);
        const nC = C * (1 - strength) + Math.min(C, best[1]) * strength;
        const nL = L * (1 - strength * 0.4) + best[0] * strength * 0.4;
        out = RecolorUtil.lab2hex([nL, nC * Math.cos(nH), nC * Math.sin(nH)]);
      }
      cache.set(hex, out); return out;
    };
    return (svg: any) => svg.replace(/(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,6})"/g, (_: any, attr: any, c: any) => `${attr}="${map(c)}"`);
  }
}
