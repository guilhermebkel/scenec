import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ChairAsset extends BaseAsset {
  readonly id = "chair";

  readonly kind = "ground";

  readonly w = 44;

  readonly h = 88;

  readonly seat = 45;

  readonly tags = ["cadeira", "seat"];

  draw(p: any, t: any) {
    const f = p.facing === "left" ? -1 : 1, c = ShapeUtil.col(t, p.color, t.secondary);
    return ShapeUtil.shadow(t, 24, 3) + ShapeUtil.rect(-16, -40, 4, 40, t.metal) + ShapeUtil.rect(12, -40, 4, 40, ColorUtil.sh(t.metal, -0.2)) +
          ShapeUtil.rect(-f * 18 - (f > 0 ? 0 : 6), -88, 6, 49, c, 3) + ShapeUtil.rect(-18, -45, 36, 6, c, 2) + ShapeUtil.rect(-18, -41, 36, 2, ColorUtil.sh(c, -0.25));
  }
}
