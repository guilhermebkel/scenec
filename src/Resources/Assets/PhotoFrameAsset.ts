import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

interface Inner {
  x0: number;
  y0: number;
  iw: number;
  ih: number;
}

type ArtBuilder = (inner: Inner, params: AssetParams, theme: Theme) => string;

export class PhotoFrameAsset extends BaseAsset {
  private static readonly ART_TO_BUILDER: Record<"portrait" | "landscape" | "poster" | "text" | "abstract", ArtBuilder> = {
    portrait: (inner, params, theme) => {
      const { x0, y0, iw, ih } = inner;
      const tone = ShapeUtil.color(theme, params.bg, theme.secondary);
      const wash = ColorUtil.sh(tone, 0.15);
      return ShapeUtil.rect(x0, y0, iw, ih, wash) + ShapeUtil.circle(0, y0 + ih * 0.4, iw * 0.16, "#D9A27A")
        + `<path d="M${x0 + iw * 0.18} ${y0 + ih} Q0 ${y0 + ih * 0.5} ${x0 + iw * 0.82} ${y0 + ih} Z" fill="${theme.ink}"/>`
        + ShapeUtil.circle(0, y0 + ih * 0.34, iw * 0.17, ColorUtil.sh(theme.ink, 0.1), "opacity=\"0.0\"");
    },
    landscape: (inner, _params, theme) => {
      const { x0, y0, iw, ih } = inner;
      return `<path d="M${x0} ${y0 + ih} L${x0 + iw * 0.35} ${y0 + ih * 0.45} L${x0 + iw * 0.6} ${y0 + ih * 0.75} `
        + `L${x0 + iw * 0.75} ${y0 + ih * 0.6} L${x0 + iw} ${y0 + ih} Z" fill="${theme.secondary}"/>`
        + ShapeUtil.circle(x0 + iw * 0.72, y0 + ih * 0.28, iw * 0.1, theme.accent);
    },
    poster: (inner, params, theme) => {
      const { x0, y0, iw, ih } = inner;
      const background = ShapeUtil.color(theme, params.bg, theme.primary);
      return ShapeUtil.rect(x0, y0, iw, ih, background)
        + `<path d="M0 ${y0 + ih * 0.45} L${x0} ${y0} L${x0 + iw * 0.4} ${y0} Z `
        + `M0 ${y0 + ih * 0.45} L${x0 + iw} ${y0 + ih * 0.1} L${x0 + iw} ${y0 + ih * 0.45} Z `
        + `M0 ${y0 + ih * 0.45} L${x0 + iw * 0.7} ${y0 + ih} L${x0 + iw * 0.3} ${y0 + ih} Z" `
        + `fill="${theme.accent}" opacity="0.75"/>`
        + ShapeUtil.circle(0, y0 + ih * 0.45, iw * 0.22, ColorUtil.sh(theme.accent, 0.4));
    },
    text: (inner, params, theme) => {
      const { x0, y0, iw, ih } = inner;
      const background = ShapeUtil.color(theme, params.bg, "#2B2B30");
      const lines = [0.3, 0.45, 0.6].map((itemIndex, index) => ShapeUtil.rect(
        x0 + iw * 0.2, y0 + ih * itemIndex, iw * (0.6 - index * 0.12), ih * 0.06, theme.paper,
        { rx: 0.3, extra: "opacity=\"0.85\"" },
      ));
      return ShapeUtil.rect(x0, y0, iw, ih, background) + lines.join("");
    },
    abstract: (inner, _params, theme) => {
      const { x0, y0, iw, ih } = inner;
      return ShapeUtil.circle(x0 + iw * 0.35, y0 + ih * 0.4, iw * 0.25, theme.primary, "opacity=\"0.8\"")
        + ShapeUtil.circle(x0 + iw * 0.62, y0 + ih * 0.62, iw * 0.22, theme.accent, "opacity=\"0.8\"");
    },
  };

  readonly id = "photo_frame";

  readonly kind = "surface";

  readonly width = 10;

  readonly height = 13;

  readonly tags = ["porta-retrato", "quadrinho", "moldura", "photo frame", "pôster de mesa"];

  size(params: AssetParams) {
    return ({ w: params.width ?? 10, h: params.height ?? 13 });
  }

  draw(params: AssetParams, theme: Theme) {
    const wide = params.width ?? 10;
    const tall = params.height ?? 13;
    const fc = ShapeUtil.color(theme, params.frame, theme.ink);
    const margin = Math.min(wide, tall) * 0.08;
    const iw = wide - margin * 2;
    const ih = tall - margin * 2;
    const x0 = -wide / 2 + margin;
    const y0 = -tall + margin;
    const bg = ShapeUtil.color(theme, params.bg, theme.paper);
    const builder = IdUtil.lookup(PhotoFrameAsset.ART_TO_BUILDER, params.art ?? "portrait");
    const art = ShapeUtil.rect(x0, y0, iw, ih, bg) + (builder?.({ x0, y0, iw, ih }, params, theme) ?? "");
    return ShapeUtil.rect(-wide / 2 + 0.5, -tall + 0.6, wide, tall, "#000000", { rx: 0.4,
      extra: "opacity=\"0.12\"" }) + ShapeUtil.rect(-wide / 2, -tall, wide, tall, fc, { rx: 0.4 }) + art
      + ShapeUtil.rect(-wide / 2, -tall, wide * 0.18, tall, "#FFFFFF", { rx: 0, extra: "opacity=\"0.06\"" });
  }
}
