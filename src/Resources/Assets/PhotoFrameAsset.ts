import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PhotoFrameAsset extends BaseAsset {
  readonly id = "photo_frame";

  readonly kind = "surface";

  readonly w = 10;

  readonly h = 13;

  readonly tags = ["porta-retrato", "quadrinho", "moldura", "photo frame", "pôster de mesa"];

  size(p: any) { return ({ w: p.width || 10, h: p.height || 13 }); }

  draw(p: any, t: any) {
    const w = p.width || 10, h = p.height || 13, fc = ShapeUtil.col(t, p.frame, t.ink), m = Math.min(w, h) * 0.08, iw = w - m * 2, ih = h - m * 2, x0 = -w / 2 + m, y0 = -h + m;
    const bg = ShapeUtil.col(t, p.bg, t.paper);
    let art = ShapeUtil.rect(x0, y0, iw, ih, bg);
    const a = p.art || "portrait";
    if (a === "portrait") { art += ShapeUtil.rect(x0, y0, iw, ih, ColorUtil.sh(ShapeUtil.col(t, p.bg, t.secondary), 0.15)) + ShapeUtil.circle(0, y0 + ih * 0.4, iw * 0.16, "#D9A27A") + `<path d="M${x0 + iw * 0.18} ${y0 + ih} Q0 ${y0 + ih * 0.5} ${x0 + iw * 0.82} ${y0 + ih} Z" fill="${t.ink}"/>` + ShapeUtil.circle(0, y0 + ih * 0.34, iw * 0.17, ColorUtil.sh(t.ink, 0.1), "opacity=\"0.0\""); } else if (a === "landscape") { art += `<path d="M${x0} ${y0 + ih} L${x0 + iw * 0.35} ${y0 + ih * 0.45} L${x0 + iw * 0.6} ${y0 + ih * 0.75} L${x0 + iw * 0.75} ${y0 + ih * 0.6} L${x0 + iw} ${y0 + ih} Z" fill="${t.secondary}"/>` + ShapeUtil.circle(x0 + iw * 0.72, y0 + ih * 0.28, iw * 0.1, t.accent); } else if (a === "poster") { art += ShapeUtil.rect(x0, y0, iw, ih, ShapeUtil.col(t, p.bg, t.primary)) + `<path d="M0 ${y0 + ih * 0.45} L${x0} ${y0} L${x0 + iw * 0.4} ${y0} Z M0 ${y0 + ih * 0.45} L${x0 + iw} ${y0 + ih * 0.1} L${x0 + iw} ${y0 + ih * 0.45} Z M0 ${y0 + ih * 0.45} L${x0 + iw * 0.7} ${y0 + ih} L${x0 + iw * 0.3} ${y0 + ih} Z" fill="${t.accent}" opacity="0.75"/>` + ShapeUtil.circle(0, y0 + ih * 0.45, iw * 0.22, ColorUtil.sh(t.accent, 0.4)); } else if (a === "text") { art += ShapeUtil.rect(x0, y0, iw, ih, ShapeUtil.col(t, p.bg, "#2B2B30")) + [0.3, 0.45, 0.6].map((k, i) => ShapeUtil.rect(x0 + iw * 0.2, y0 + ih * k, iw * (0.6 - i * 0.12), ih * 0.06, t.paper, 0.3, "opacity=\"0.85\"")).join(""); } else if (a === "abstract") { art += ShapeUtil.circle(x0 + iw * 0.35, y0 + ih * 0.4, iw * 0.25, t.primary, "opacity=\"0.8\"") + ShapeUtil.circle(x0 + iw * 0.62, y0 + ih * 0.62, iw * 0.22, t.accent, "opacity=\"0.8\""); }
    return ShapeUtil.rect(-w / 2 + 0.5, -h + 0.6, w, h, "#000000", 0.4, "opacity=\"0.12\"") + ShapeUtil.rect(-w / 2, -h, w, h, fc, 0.4) + art + ShapeUtil.rect(-w / 2, -h, w * 0.18, h, "#FFFFFF", 0, "opacity=\"0.06\"");
  }
}
