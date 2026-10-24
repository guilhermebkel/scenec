import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TableAsset extends BaseAsset {
  readonly id = "table";

  readonly kind = "ground";

  readonly width = 80;

  readonly height = 46;

  readonly top = 46;

  readonly tags = ["mesa", "mesa redonda", "cafe_table", "dining_table"];

  draw(params: AssetParams, theme: Theme) {
    const wide = params.width || 80; return ShapeUtil.shadow(theme, wide / 2, 3.5) + ShapeUtil.rect(-3.5, -40, 7, 37, theme.metal) + ShapeUtil.rect(0, -40, 3.5, 37, ColorUtil.sh(theme.metal, -0.2))
      + `<path d="M-20 0 Q0 -8 20 0 Z" fill="${theme.metal}"/>` + ShapeUtil.rect(-wide / 2, -46, wide, 6, theme.wood, 3) + ShapeUtil.rect(-wide / 2, -42, wide, 2, ColorUtil.sh(theme.wood, -0.22));
  }

  size(params: AssetParams) { return ({ w: params.width || 80, h: 46 }); }
}
