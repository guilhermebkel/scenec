import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class HouseAsset extends BaseAsset {
  readonly id = "house";

  readonly kind = "ground";

  readonly width = 160;

  readonly height = 175;

  readonly tags = ["casa", "home"];

  draw(params: AssetParams, theme: Theme) {
    const body = ShapeUtil.color(theme, params.color, theme.primary), roof = theme.secondary;
    return ShapeUtil.shadow(theme, 88, 5)
      + ShapeUtil.rect(40, -150, 16, 32, theme.woodDark) + ShapeUtil.rect(48, -150, 8, 32,
      ColorUtil.sh(theme.woodDark, -0.2)) + ShapeUtil.rect(38, -154, 20, 6, ColorUtil.sh(theme.woodDark, -0.1),
      { rx: 1 })
    + ShapeUtil.rect(-65, -100, 130, 100, body) + ShapeUtil.rect(25, -100, 40, 100, ColorUtil.sh(body, -0.12))
    + `<path d="M-65 -100 L65 -100 L65 -92 L-65 -92 Z" fill="${ColorUtil.sh(body, -0.28)}" opacity="0.6"/>`
    + `<path d="M-80 -95 L0 -170 L80 -95 Z" fill="${roof}"/><path d="M0 -170 L80 -95 L40 -95 Z" fill="${ColorUtil.sh(roof, -0.18)}"/>`
    + `<path d="M-84 -92 L0 -172 L84 -92" stroke="${ColorUtil.sh(roof, -0.3)}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`
    + ShapeUtil.rect(-15, -56, 30, 56, theme.woodDark, { rx: 3 }) + ShapeUtil.rect(2, -56, 13, 56,
      ColorUtil.sh(theme.woodDark, -0.15), { rx: 0 }) + ShapeUtil.circle(9, -28, 2, theme.accent)
    + ShapeUtil.rect(-19, -2, 38, 3, ColorUtil.sh(body, -0.35))
    + ([[-52, -80], [26, -80]] as Array<[number, number]>).map(([posX, posY]) => ShapeUtil.rect(posX, posY, 26, 24, theme.glass, { rx: 2,
      extra: `stroke="${theme.paper}" stroke-width="3"` })
    + `<path d="M${posX + 4} ${posY + 18} L${posX + 14} ${posY + 4}" stroke="${theme.paper}" stroke-width="2.5" opacity="0.6"/>`
    + ShapeUtil.rect(posX - 3, posY + 24, 32, 3, theme.paper, { rx: 1 })).join("")
  + ShapeUtil.circle(0, -122, 9, theme.glass, `stroke="${theme.paper}" stroke-width="3"`);
  }
}
