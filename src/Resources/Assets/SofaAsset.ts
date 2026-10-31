import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { DetailUtil } from "@/Utils/DetailUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SofaAsset extends BaseAsset {
  readonly id = "sofa";

  readonly kind = "ground";

  readonly width = 170;

  readonly height = 72;

  readonly seat = 36;

  readonly tags = ["sofá", "sofa", "couch"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.secondary), darker = ColorUtil.sh(mainColor, -0.15);
    const rank = DetailUtil.rankOf(params.detail);
    const hasParts = rank >= 1;
    const light = ColorUtil.sh(mainColor, 0.12);
    const texture = rank >= 2
      ? ShapeUtil.rect(-66, -66, 62, 3, light, { rx: 1.5 }) + ShapeUtil.rect(4, -66, 62, 3, light, { rx: 1.5 })
      + `<path d="M-70 -30 L-56 -30 M-40 -29 L-26 -29 M-10 -30 L4 -30 M26 -29 L40 -29 M56 -30 L70 -30" `
      + `stroke="${ColorUtil.sh(mainColor, -0.12)}" stroke-width="0.7" stroke-linecap="round" fill="none"/>`
      + `<path d="M-56 -58 L-36 -46 M-52 -62 L-32 -50" stroke="${ColorUtil.sh(theme.accent, 0.2)}" stroke-width="1.2" `
      + `stroke-linecap="round" transform="rotate(-8 -46 -50)"/>`
      + ShapeUtil.rect(-84, -36, 16, 1.2, ColorUtil.sh(darker, -0.15))
      + ShapeUtil.rect(68, -36, 16, 1.2, ColorUtil.sh(darker, -0.15))
      : "";
    return ShapeUtil.shadow(theme, 86, 4.5) + ShapeUtil.rect(-70, -8, 6, 8, theme.woodDark) + ShapeUtil.rect(64, -8,
      6, 8, theme.woodDark)
    + ShapeUtil.rect(-75, -72, 150, 42, darker, { rx: 14 }) + ShapeUtil.rect(-68, -68, 66, 34, mainColor,
      { rx: 10 }) + ShapeUtil.rect(2, -68, 66, 34, mainColor, { rx: 10 })
    + ShapeUtil.rect(-80, -40, 160, 32, mainColor, { rx: 8 }) + ShapeUtil.rect(-80, -18, 160, 10, darker, { rx: 6 })
    + ShapeUtil.rect(-86, -56, 20, 50, darker, { rx: 9 }) + ShapeUtil.rect(66, -56, 20, 50, darker, { rx: 9 })
    + (hasParts
      ? ShapeUtil.rect(-86, -56, 20, 8, ColorUtil.sh(mainColor, 0.1), { rx: 6 }) + ShapeUtil.rect(66, -56, 20, 8,
        ColorUtil.sh(mainColor, 0.1), { rx: 6 })
      + ShapeUtil.rect(-60, -62, 28, 24, theme.accent, { rx: 6, extra: "transform=\"rotate(-8 -46 -50)\"" })
      + ShapeUtil.rect(-50, -40, 100, 2, ColorUtil.sh(mainColor, -0.3))
      : "")
    + texture;
  }
}
