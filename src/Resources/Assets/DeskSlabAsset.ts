import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DeskSlabAsset extends BaseAsset {
  readonly id = "desk_slab";

  readonly kind = "ground";

  readonly isHollow = true;

  readonly width = 120;

  readonly height = 46;

  readonly top = 46;

  readonly tags = ["tampo", "bancada", "desk top", "mesa planejada"];

  size(params: AssetParams) {
    return ({ w: params.width ?? 120, h: params.height ?? 46 });
  }

  topOf(params: AssetParams) {
    return params.height ?? 46;
  }

  draw(params: AssetParams, theme: Theme) {
    const wide = params.width ?? 120, tall = params.height ?? 46, th = params.thickness ?? 4,
      mainColor = ShapeUtil.color(theme, params.color, theme.wood);
    let svg = ShapeUtil.rect(-wide / 2, -tall, wide, th, mainColor) + ShapeUtil.rect(-wide / 2, -tall + th - 1.2,
      wide, 1.2, ColorUtil.sh(mainColor, -0.18)) + ShapeUtil.rect(-wide / 2, -tall, wide, 0.8,
      ColorUtil.sh(mainColor, 0.25));
    const ends = params.ends ?? "none";
    if (ends === "left" || ends === "both") {
      svg = ShapeUtil.rect(-wide / 2, -tall, 3, tall, ColorUtil.sh(mainColor,
        -0.06)) + ShapeUtil.rect(-wide / 2 + 2, -tall, 1, tall, ColorUtil.sh(mainColor, -0.2)) + svg;
    }
    if (ends === "right" || ends === "both") {
      svg = ShapeUtil.rect(wide / 2 - 3, -tall, 3, tall,
        ColorUtil.sh(mainColor, -0.12)) + svg;
    }
    return svg;
  }
}
