import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ShelfWallAsset extends BaseAsset {
  readonly id = "shelf_wall";

  readonly kind = "wall";

  readonly width = 90;

  readonly height = 34;

  readonly elevation = 100;

  readonly tags = ["prateleira", "wall_shelf"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-45, -6, 90, 6, theme.wood, 1) + ShapeUtil.rect(-45, 0, 90, 2, ColorUtil.sh(theme.wood, -0.25)) + ShapeUtil.rect(-38, -26, 7, 20, theme.primary, 1) + ShapeUtil.rect(-30, -24, 6, 18, theme.secondary, 1)
      + ShapeUtil.rect(-23, -27, 7, 21, theme.accent, 1) + `<path d="M8 -6 L12 -18 L22 -18 L26 -6 Z" fill="${theme.primary}"/>` + `<path d="M17 -18 Q10 -30 14 -36 Q18 -28 17 -18 Z M17 -18 Q24 -28 22 -34 Q16 -28 17 -18 Z" fill="${theme.foliage[0]}"/>`;
  }
}
