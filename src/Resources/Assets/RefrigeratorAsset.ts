import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class RefrigeratorAsset extends BaseAsset {
  readonly id = "refrigerator";

  readonly kind = "ground";

  readonly width = 64;

  readonly height = 150;

  readonly top = 150;

  readonly tags = ["geladeira", "fridge", "freezer", "refrigerator", "refrigerador"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.metal);
    const shade = ColorUtil.sh(mainColor, -0.15);
    const dark = ColorUtil.sh(mainColor, -0.3);
    const handleColor = ColorUtil.sh(theme.metal, 0.2);
    return ShapeUtil.shadow(theme, 32, 4)
      + ShapeUtil.rect(-32, -150, 64, 150, mainColor, { rx: 6 })
      + ShapeUtil.rect(14, -150, 18, 150, shade, { rx: 6 })
      + ShapeUtil.rect(-32, -100, 64, 2, dark)
      + ShapeUtil.rect(-26, -135, 4, 24, handleColor, { rx: 2 })
      + ShapeUtil.rect(-26, -90, 4, 40, handleColor, { rx: 2 })
      + ShapeUtil.rect(-10, -140, 16, 6, dark, { rx: 2 });
  }
}
