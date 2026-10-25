import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BedAsset extends BaseAsset {
  readonly id = "bed";

  readonly kind = "ground";

  readonly width = 180;

  readonly height = 70;

  readonly top = 38;

  readonly seat = 38;

  readonly tags = ["cama", "bed"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.primary);
    return ShapeUtil.shadow(theme, 90, 4) + ShapeUtil.rect(-90, -70, 10, 70, theme.woodDark, { rx: 3 })
      + ShapeUtil.rect(80, -46, 10, 46, theme.woodDark, { rx: 3 })
      + ShapeUtil.rect(-82, -34, 166, 22, theme.paper, { rx: 4 }) + ShapeUtil.rect(-82, -16, 166, 6,
      ColorUtil.sh(theme.paper, -0.12)) + ShapeUtil.rect(-76, -46, 40, 14, theme.paper, { rx: 7 })
    + ShapeUtil.rect(-76, -38, 40, 6, ColorUtil.sh(theme.paper, -0.1), { rx: 3 })
    + `<path d="M-30 -40 Q20 -44 84 -38 L84 -14 L-34 -14 Z" fill="${mainColor}"/><path d="M-30 -22 L84 -22 L84 -14 L-34 -14 Z" fill="${ColorUtil.sh(mainColor, -0.15)}"/>`
    + ShapeUtil.rect(-84, -10, 168, 4, theme.woodDark, { rx: 1 });
  }
}
