import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PizzaAsset extends BaseAsset {
  readonly id = "pizza";

  readonly kind = "surface";

  readonly w = 40;

  readonly h = 8;

  readonly tags = ["pizza"];

  draw(p: any, t: any) {
    return ShapeUtil.ell(0, -2, 20, 4.5, t.paper) + ShapeUtil.ell(0, -3, 17, 3.5, "#E9B44C") + ShapeUtil.ell(0, -3.4, 15, 2.8, t.primary) +
        [[-8, -3.6], [2, -4.2], [9, -3], [-2, -2.6], [5, -2.2]].map(([x, y], i) => ShapeUtil.ell(x, y, 2, 0.9, i % 2 ? "#F6E6B4" : ColorUtil.sh(t.primary, -0.35))).join("") + ShapeUtil.ell(-5, -4.6, 2.5, 0.7, "#5E8C3A");
  }
}
