import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BushAsset extends BaseAsset {
  readonly id = "bush";

  readonly kind = "ground";

  readonly width = 74;

  readonly height = 44;

  readonly tags = ["arbusto", "shrub"];

  draw(params: AssetParams, theme: Theme) {
    const [first, second, color] = theme.foliage;
    return ShapeUtil.shadow(theme, 36, 3) + ShapeUtil.circle(-20, -14, 15, color)
      + ShapeUtil.circle(20, -14, 15, ColorUtil.sh(color, -0.1)) + ShapeUtil.circle(0, -24, 21, first)
      + `<path d="M0 -3 A21 21 0 0 0 21 -24 A21 21 0 0 1 6 -5 Z" fill="${ColorUtil.sh(first, -0.12)}"/>`
      + ShapeUtil.circle(-9, -12, 12, second) + ShapeUtil.circle(10, -11, 12, ColorUtil.sh(second, -0.08))
      + ShapeUtil.circle(-6, -34, 6, ColorUtil.sh(first, 0.2), "opacity=\"0.6\"");
  }
}
