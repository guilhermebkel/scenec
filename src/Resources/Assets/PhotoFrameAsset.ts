import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PhotoFrameAsset extends BaseAsset {
  readonly id = "photo_frame";

  readonly kind = "surface";

  readonly width = 10;

  readonly height = 13;

  readonly tags = ["porta-retrato", "quadrinho", "moldura", "photo frame", "pôster de mesa"];

  size(params: AssetParams) { return ({ w: params.width || 10, h: params.height || 13 }); }

  draw(params: AssetParams, theme: Theme) {
    const wide = params.width || 10, tall = params.height || 13, fc = ShapeUtil.col(theme, params.frame, theme.ink), margin = Math.min(wide, tall) * 0.08, iw = wide - margin * 2, ih = tall - margin * 2, x0 = -wide / 2 + margin, y0 = -tall + margin;
    const bg = ShapeUtil.col(theme, params.bg, theme.paper);
    let art = ShapeUtil.rect(x0, y0, iw, ih, bg);
    const first = params.art || "portrait";
    if (first === "portrait") { art += ShapeUtil.rect(x0, y0, iw, ih, ColorUtil.sh(ShapeUtil.col(theme, params.bg, theme.secondary), 0.15)) + ShapeUtil.circle(0, y0 + ih * 0.4, iw * 0.16, "#D9A27A") + `<path d="M${x0 + iw * 0.18} ${y0 + ih} Q0 ${y0 + ih * 0.5} ${x0 + iw * 0.82} ${y0 + ih} Z" fill="${theme.ink}"/>` + ShapeUtil.circle(0, y0 + ih * 0.34, iw * 0.17, ColorUtil.sh(theme.ink, 0.1), "opacity=\"0.0\""); } else if (first === "landscape") { art += `<path d="M${x0} ${y0 + ih} L${x0 + iw * 0.35} ${y0 + ih * 0.45} L${x0 + iw * 0.6} ${y0 + ih * 0.75} L${x0 + iw * 0.75} ${y0 + ih * 0.6} L${x0 + iw} ${y0 + ih} Z" fill="${theme.secondary}"/>` + ShapeUtil.circle(x0 + iw * 0.72, y0 + ih * 0.28, iw * 0.1, theme.accent); } else if (first === "poster") { art += ShapeUtil.rect(x0, y0, iw, ih, ShapeUtil.col(theme, params.bg, theme.primary)) + `<path d="M0 ${y0 + ih * 0.45} L${x0} ${y0} L${x0 + iw * 0.4} ${y0} Z M0 ${y0 + ih * 0.45} L${x0 + iw} ${y0 + ih * 0.1} L${x0 + iw} ${y0 + ih * 0.45} Z M0 ${y0 + ih * 0.45} L${x0 + iw * 0.7} ${y0 + ih} L${x0 + iw * 0.3} ${y0 + ih} Z" fill="${theme.accent}" opacity="0.75"/>` + ShapeUtil.circle(0, y0 + ih * 0.45, iw * 0.22, ColorUtil.sh(theme.accent, 0.4)); } else if (first === "text") { art += ShapeUtil.rect(x0, y0, iw, ih, ShapeUtil.col(theme, params.bg, "#2B2B30")) + [0.3, 0.45, 0.6].map((itemIndex, index) => ShapeUtil.rect(x0 + iw * 0.2, y0 + ih * itemIndex, iw * (0.6 - index * 0.12), ih * 0.06, theme.paper, 0.3, "opacity=\"0.85\"")).join(""); } else if (first === "abstract") { art += ShapeUtil.circle(x0 + iw * 0.35, y0 + ih * 0.4, iw * 0.25, theme.primary, "opacity=\"0.8\"") + ShapeUtil.circle(x0 + iw * 0.62, y0 + ih * 0.62, iw * 0.22, theme.accent, "opacity=\"0.8\""); }
    return ShapeUtil.rect(-wide / 2 + 0.5, -tall + 0.6, wide, tall, "#000000", 0.4, "opacity=\"0.12\"") + ShapeUtil.rect(-wide / 2, -tall, wide, tall, fc, 0.4) + art + ShapeUtil.rect(-wide / 2, -tall, wide * 0.18, tall, "#FFFFFF", 0, "opacity=\"0.06\"");
  }
}
