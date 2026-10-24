import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FigurineAsset extends BaseAsset {
  readonly id = "figurine";

  readonly kind = "surface";

  readonly w = 4;

  readonly h = 6;

  readonly tags = ["boneco", "miniatura", "action figure", "toy"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.primary);
    return ShapeUtil.ell(0, -0.4, 2, 0.6, ColorUtil.sh(c, -0.3)) + ShapeUtil.rect(-1.4, -3.6, 2.8, 3.2, c, 1) + ShapeUtil.circle(0, -4.9, 1.7, "#F0C8A0") + `<path d="M-1.8 -5.2 Q0 -7.4 1.8 -5.2 Z" fill="${ShapeUtil.col(t, p.hair, t.ink)}"/>` + ShapeUtil.rect(-1.9, -3.4, 0.7, 2, ColorUtil.sh(c, -0.2), 0.3);
  }
}
