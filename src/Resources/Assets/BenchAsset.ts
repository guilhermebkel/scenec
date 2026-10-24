import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BenchAsset extends BaseAsset {
  readonly id = "bench";

  readonly kind = "ground";

  readonly w = 110;

  readonly h = 60;

  readonly seat = 36;

  readonly tags = ["banco", "park_bench"];

  draw(p: any, t: any) {
    return ShapeUtil.shadow(t, 55, 3) + ShapeUtil.rect(-55, -40, 110, 6, t.wood, 2) + ShapeUtil.rect(-55, -36, 110, 2, ColorUtil.sh(t.wood, -0.2)) + ShapeUtil.rect(-55, -58, 110, 6, t.wood, 2) + ShapeUtil.rect(-55, -54, 110, 2, ColorUtil.sh(t.wood, -0.2))
      + ShapeUtil.rect(-48, -34, 5, 34, t.metal) + ShapeUtil.rect(43, -34, 5, 34, t.metal) + ShapeUtil.rect(-48, -58, 4, 20, t.metal) + ShapeUtil.rect(44, -58, 4, 20, t.metal);
  }
}
