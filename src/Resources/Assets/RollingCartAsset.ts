import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class RollingCartAsset extends BaseAsset {
  readonly id = "rolling_cart";

  readonly kind = "ground";

  readonly w = 26;

  readonly h = 36;

  readonly top = 36;

  readonly tags = ["gaveteiro com rodinhas", "carrinho", "rolling cabinet"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.wood), d = ColorUtil.sh(c, -0.35);
    let s = ShapeUtil.shadow(t, 14, 1.5) + ShapeUtil.rect(-13, -36, 26, 33, ColorUtil.sh(c, -0.08)) +
          ShapeUtil.rect(-11.5, -34.5, 23, 9, d) + ShapeUtil.rect(-11.5, -24, 23, 9, d) + ShapeUtil.rect(-13, -25.5, 26, 1.5, c) +
          ShapeUtil.rect(-9, -30, 10, 4.5, t.paper, 0.5) + ShapeUtil.rect(-8, -31, 6, 1.5, t.primary) + ShapeUtil.rect(3, -29, 5, 3.5, t.paper) +
          ShapeUtil.rect(-9, -21.5, 17, 6, t.ink, 1) + ShapeUtil.rect(-9, -21.5, 17, 1, ColorUtil.sh(t.ink, 0.2));
    [-14.5, -8.5].forEach((y) => { s += ShapeUtil.rect(-12, y, 24, 5.6, c, 0.5) + ShapeUtil.rect(-7, y + 2.6, 14, 0.8, t.metal, 0.4); });
    return s + [-10, 10].map((x) => ShapeUtil.circle(x, -1.5, 1.6, t.ink)).join("");
  }
}
