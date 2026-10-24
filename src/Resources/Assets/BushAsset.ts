import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BushAsset extends BaseAsset {
  readonly id = "bush";

  readonly kind = "ground";

  readonly w = 74;

  readonly h = 44;

  readonly tags = ["arbusto", "shrub"];

  draw(p: any, t: any) {
    const [a, b, c] = t.foliage; return ShapeUtil.shadow(t, 36, 3) + ShapeUtil.circle(-20, -14, 15, c) + ShapeUtil.circle(20, -14, 15, ColorUtil.sh(c, -0.1)) + ShapeUtil.circle(0, -24, 21, a) +
        `<path d="M0 -3 A21 21 0 0 0 21 -24 A21 21 0 0 1 6 -5 Z" fill="${ColorUtil.sh(a, -0.12)}"/>` + ShapeUtil.circle(-9, -12, 12, b) + ShapeUtil.circle(10, -11, 12, ColorUtil.sh(b, -0.08)) + ShapeUtil.circle(-6, -34, 6, ColorUtil.sh(a, 0.2), "opacity=\"0.6\"");
  }
}
