import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
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
    return ShapeUtil.shadow(theme, 86, 4.5) + ShapeUtil.rect(-70, -8, 6, 8, theme.woodDark) + ShapeUtil.rect(64, -8,
      6, 8, theme.woodDark)
    + ShapeUtil.rect(-75, -72, 150, 42, darker, { rx: 14 }) + ShapeUtil.rect(-68, -68, 66, 34, mainColor,
      { rx: 10 }) + ShapeUtil.rect(2, -68, 66, 34, mainColor, { rx: 10 })
    + ShapeUtil.rect(-80, -40, 160, 32, mainColor, { rx: 8 }) + ShapeUtil.rect(-80, -18, 160, 10, darker, { rx: 6 })
    + ShapeUtil.rect(-86, -56, 20, 50, darker, { rx: 9 }) + ShapeUtil.rect(66, -56, 20, 50, darker, { rx: 9 })
    + ShapeUtil.rect(-86, -56, 20, 8, ColorUtil.sh(mainColor, 0.1), { rx: 6 }) + ShapeUtil.rect(66, -56, 20, 8,
      ColorUtil.sh(mainColor, 0.1), { rx: 6 })
    + ShapeUtil.rect(-60, -62, 28, 24, theme.accent, { rx: 6, extra: "transform=\"rotate(-8 -46 -50)\"" })
    + ShapeUtil.rect(-50, -40, 100, 2, ColorUtil.sh(mainColor, -0.3));
  }
}
