import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FenceAsset extends BaseAsset {
  readonly id = "fence";

  readonly kind = "ground";

  readonly w = 160;

  readonly h = 40;

  readonly tags = ["cerca"];

  draw(p: any, t: any) {
    let s = ShapeUtil.rect(-80, -30, 160, 5, t.paper) + ShapeUtil.rect(-80, -15, 160, 5, t.paper) + ShapeUtil.rect(-80, -25, 160, 2, ColorUtil.sh(t.paper, -0.15)) + ShapeUtil.rect(-80, -10, 160, 2, ColorUtil.sh(t.paper, -0.15));
    for (let x = -76; x <= 70; x += 18) s += `<path d="M${x} 0 L${x} -34 L${x + 5} -40 L${x + 10} -34 L${x + 10} 0 Z" fill="${t.paper}"/><path d="M${x + 6} 0 L${x + 6} -38 L${x + 10} -34 L${x + 10} 0 Z" fill="${ColorUtil.sh(t.paper, -0.12)}"/>`;
    return s;
  }
}
