import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DrawerUnitAsset extends BaseAsset {
  readonly id = "drawer_unit";

  readonly kind = "ground";

  readonly width = 26;

  readonly height = 42;

  readonly tags = ["gaveteiro", "gavetas", "drawers"];

  size(params: AssetParams) { return ({ w: params.width || 26, h: params.height || 42 }); }

  draw(params: AssetParams, theme: Theme) {
    const wide = params.width || 26, tall = params.height || 42, count = params.drawers || 4, mainColor = ShapeUtil.col(theme, params.color, theme.wood), plinth = 2.5;
    let svg = ShapeUtil.shadow(theme, wide * 0.55, 1.8) + ShapeUtil.rect(-wide / 2, -tall, wide, tall, ColorUtil.sh(mainColor, -0.08)) + ShapeUtil.rect(-wide / 2, -plinth, wide, plinth, ColorUtil.sh(mainColor, -0.25));
    const dh = (tall - plinth - 1) / count;
    for (let index = 0; index < count; index++) {
      const posY = -tall + 0.6 + index * dh;
      svg += ShapeUtil.rect(-wide / 2 + 0.8, posY, wide - 1.6, dh - 0.7, mainColor, 0.6) + ShapeUtil.rect(-wide / 2 + 0.8, posY + dh - 1.4, wide - 1.6, 0.7, ColorUtil.sh(mainColor, -0.15))
        + ShapeUtil.rect(-wide * 0.28, posY + dh * 0.42, wide * 0.56, 0.8, theme.metal, 0.4) + ShapeUtil.rect(-wide * 0.28, posY + dh * 0.42 + 0.6, wide * 0.56, 0.35, ColorUtil.sh(theme.metal, -0.3));
    }
    return svg;
  }
}
