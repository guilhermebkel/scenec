import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SofaAsset extends BaseAsset {
  readonly id = "sofa";

  readonly kind = "ground";

  readonly w = 170;

  readonly h = 72;

  readonly seat = 36;

  readonly tags = ["sofá", "sofa", "couch"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.secondary), d = ColorUtil.sh(c, -0.15);
    return ShapeUtil.shadow(t, 86, 4.5) + ShapeUtil.rect(-70, -8, 6, 8, t.woodDark) + ShapeUtil.rect(64, -8, 6, 8, t.woodDark)
      + ShapeUtil.rect(-75, -72, 150, 42, d, 14) + ShapeUtil.rect(-68, -68, 66, 34, c, 10) + ShapeUtil.rect(2, -68, 66, 34, c, 10)
      + ShapeUtil.rect(-80, -40, 160, 32, c, 8) + ShapeUtil.rect(-80, -18, 160, 10, d, 6)
      + ShapeUtil.rect(-86, -56, 20, 50, d, 9) + ShapeUtil.rect(66, -56, 20, 50, d, 9) + ShapeUtil.rect(-86, -56, 20, 8, ColorUtil.sh(c, 0.1), 6) + ShapeUtil.rect(66, -56, 20, 8, ColorUtil.sh(c, 0.1), 6)
      + ShapeUtil.rect(-60, -62, 28, 24, t.accent, 6, "transform=\"rotate(-8 -46 -50)\"") + ShapeUtil.rect(-50, -40, 100, 2, ColorUtil.sh(c, -0.3));
  }
}
