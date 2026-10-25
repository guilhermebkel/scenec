import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class MonitorAsset extends BaseAsset {
  readonly id = "monitor";

  readonly kind = "surface";

  readonly width = 50;

  readonly height = 46;

  readonly tags = ["tela", "screen", "display"];

  draw(params: AssetParams, theme: Theme) {
    return params.off
      ? ShapeUtil.rect(-3, -14, 6, 14, theme.ink) + ShapeUtil.rect(-12, -2.5, 24, 2.5, theme.ink, { rx: 1 })
      + ShapeUtil.rect(-25, -46, 50, 33, theme.ink, { rx: 2 }) + ShapeUtil.rect(-24, -45, 48, 30,
        ColorUtil.sh(theme.ink, 0.12), { rx: 1 })
      + `<path d="M-24 -45 L-6 -45 L-24 -25 Z" fill="#FFFFFF" opacity="0.06"/>`
      : ShapeUtil.rect(-4, -14, 8, 14, theme.metal) + ShapeUtil.rect(-14, -3, 28, 3, theme.metal, { rx: 1.5 })
        + ShapeUtil.rect(-25, -46, 50, 33, theme.ink, { rx: 3 }) + ShapeUtil.rect(-21, -42, 42, 25, theme.glass,
        { rx: 1 })
      + ShapeUtil.rect(-17, -38, 18, 3, theme.primary, { rx: 1 }) + ShapeUtil.rect(-17, -32, 28, 2.5, theme.paper,
        { rx: 1, extra: "opacity=\"0.8\"" }) + ShapeUtil.rect(-17, -27, 22, 2.5, theme.paper, { rx: 1,
        extra: "opacity=\"0.8\"" });
  }
}
