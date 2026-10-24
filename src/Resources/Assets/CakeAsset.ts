import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CakeAsset extends BaseAsset {
  readonly id = "cake";

  readonly kind = "surface";

  readonly w = 30;

  readonly h = 26;

  readonly tags = ["bolo", "dessert"];

  draw(p: any, t: any) {
    return ShapeUtil.rect(-16, -2, 32, 2, t.paper, 1) + ShapeUtil.rect(-13, -18, 26, 16, t.paper, 2) + ShapeUtil.rect(4, -18, 9, 16, ColorUtil.sh(t.paper, -0.1)) + ShapeUtil.rect(-13, -12, 26, 3, t.primary) +
        `<path d="M-13 -18 Q-9 -14 -5 -18 Q-1 -14 3 -18 Q7 -14 13 -18 L13 -20 L-13 -20 Z" fill="${t.primary}"/>` + ShapeUtil.circle(0, -23, 3, t.primary) + ShapeUtil.circle(-1, -24, 1, ColorUtil.sh(t.primary, 0.4));
  }
}
