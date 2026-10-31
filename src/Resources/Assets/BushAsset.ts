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
    return ShapeUtil.shadow(theme, 36, 3)
      + ShapeUtil.blob(-20, -14, 15, { seed: 21, lobes: 4, fill: color })
      + ShapeUtil.blob(20, -14, 15, { seed: 22, lobes: 4, fill: ColorUtil.sh(color, -0.1) })
      + ShapeUtil.blob(0, -24, 21, { seed: 23, lobes: 5, fill: ColorUtil.sh(first, -0.12) })
      + ShapeUtil.blob(-1.5, -25.5, 19.5, { seed: 23, lobes: 5, fill: first })
      + ShapeUtil.blob(-9, -12, 12, { seed: 24, lobes: 4, fill: second })
      + ShapeUtil.blob(10, -11, 12, { seed: 25, lobes: 4, fill: ColorUtil.sh(second, -0.08) })
      + ShapeUtil.blob(-6, -34, 6, { seed: 26, lobes: 3, fill: ColorUtil.sh(first, 0.2), extra: "opacity=\"0.6\"" });
  }
}
