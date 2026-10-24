import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TvStandAsset extends BaseAsset {
  readonly id = "tv_stand";

  readonly kind = "ground";

  readonly width = 120;

  readonly height = 40;

  readonly top = 40;

  readonly tags = ["rack", "móvel de tv", "tv_cabinet"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.shadow(theme, 60, 3) + ShapeUtil.rect(-60, -40, 120, 36, theme.wood, 3) + ShapeUtil.rect(-60, -40, 120, 4, ColorUtil.sh(theme.wood, 0.15), 2) + ShapeUtil.rect(-54, -32, 52, 24, ColorUtil.sh(theme.wood, -0.12), 2) + ShapeUtil.rect(2, -32, 52, 24, ColorUtil.sh(theme.wood, -0.12), 2)
      + ShapeUtil.rect(-30, -22, 10, 2.5, theme.metal, 1) + ShapeUtil.rect(22, -22, 10, 2.5, theme.metal, 1) + ShapeUtil.rect(-56, -4, 6, 4, theme.woodDark) + ShapeUtil.rect(50, -4, 6, 4, theme.woodDark);
  }
}
