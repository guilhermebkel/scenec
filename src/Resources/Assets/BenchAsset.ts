import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BenchAsset extends BaseAsset {
  readonly id = "bench";

  readonly kind = "ground";

  readonly width = 110;

  readonly height = 60;

  readonly seat = 36;

  readonly tags = ["banco", "park_bench"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.shadow(theme, 55, 3) + ShapeUtil.rect(-55, -40, 110, 6, theme.wood, { rx: 2 })
      + ShapeUtil.rect(-55, -36, 110, 2, ColorUtil.sh(theme.wood, -0.2)) + ShapeUtil.rect(-55, -58, 110, 6,
      theme.wood, { rx: 2 }) + ShapeUtil.rect(-55, -54, 110, 2, ColorUtil.sh(theme.wood, -0.2))
    + ShapeUtil.rect(-48, -34, 5, 34, theme.metal) + ShapeUtil.rect(43, -34, 5, 34, theme.metal)
    + ShapeUtil.rect(-48, -58, 4, 20, theme.metal) + ShapeUtil.rect(44, -58, 4, 20, theme.metal);
  }
}
