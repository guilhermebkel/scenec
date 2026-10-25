import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PlateAsset extends BaseAsset {
  readonly id = "plate";

  readonly kind = "surface";

  readonly width = 26;

  readonly height = 4;

  readonly tags = ["prato", "dish"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.paper);
    return ShapeUtil.ellipse(0, -1.5, 13, 3, mainColor)
      + ShapeUtil.ellipse(0, -2, 9, 1.8, ColorUtil.sh(mainColor, -0.08));
  }
}
