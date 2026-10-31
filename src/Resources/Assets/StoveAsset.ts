import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class StoveAsset extends BaseAsset {
  readonly id = "stove";

  readonly kind = "ground";

  readonly width = 60;

  readonly height = 90;

  readonly top = 90;

  readonly tags = ["fogão", "fogao", "stove", "oven", "cooker", "cooktop"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.metal);
    const dark = ColorUtil.sh(mainColor, -0.25);
    const burner = ColorUtil.sh(theme.metal, -0.4);
    return ShapeUtil.shadow(theme, 30, 4)
      + ShapeUtil.rect(-30, -90, 60, 90, mainColor, { rx: 4 })
      + ShapeUtil.rect(-26, -86, 52, 6, dark, { rx: 2 })
      + ShapeUtil.circle(-18, -83, 2, theme.accent)
      + ShapeUtil.circle(-6, -83, 2, theme.metal)
      + ShapeUtil.circle(6, -83, 2, theme.metal)
      + ShapeUtil.circle(18, -83, 2, theme.accent)
      + ShapeUtil.rect(-24, -72, 48, 48, dark, { rx: 3 })
      + ShapeUtil.rect(-20, -68, 40, 40, ColorUtil.sh(dark, -0.3), { rx: 2 })
      + ShapeUtil.rect(-16, -74, 32, 3, theme.metal, { rx: 1 })
      + ShapeUtil.circle(-14, -90, 6, burner)
      + ShapeUtil.circle(14, -90, 6, burner);
  }
}
