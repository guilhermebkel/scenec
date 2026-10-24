import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SuitcaseAsset extends BaseAsset {
  readonly id = "suitcase";

  readonly kind = "any";

  readonly w = 30;

  readonly h = 46;

  readonly tags = ["mala", "luggage", "bagagem"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.accent);
    return `<path d="M-6 -36 L-6 -44 L6 -44 L6 -36" stroke="${t.ink}" stroke-width="2.5" fill="none"/>` + ShapeUtil.rect(-15, -38, 30, 36, c, 4) + ShapeUtil.rect(5, -38, 10, 36, ColorUtil.sh(c, -0.15), 4)
      + ShapeUtil.rect(-8, -38, 2, 36, ColorUtil.sh(c, -0.25)) + ShapeUtil.rect(6, -38, 2, 36, ColorUtil.sh(c, -0.3)) + ShapeUtil.circle(-9, -1, 2.5, t.ink) + ShapeUtil.circle(9, -1, 2.5, t.ink) + ShapeUtil.circle(-2, -30, 3, t.primary) + ShapeUtil.rect(-12, -18, 8, 6, t.paper, 1, "transform=\"rotate(-10 -8 -15)\"");
  }
}
