import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BackpackAsset extends BaseAsset {
  readonly id = "backpack";

  readonly kind = "any";

  readonly w = 26;

  readonly h = 34;

  readonly tags = ["mochila"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.secondary);
    return `<path d="M-6 -30 Q0 -38 6 -30" stroke="${ColorUtil.sh(c, -0.3)}" stroke-width="2.5" fill="none"/>` + ShapeUtil.rect(-12, -30, 24, 30, c, 8) + ShapeUtil.rect(2, -30, 10, 30, ColorUtil.sh(c, -0.15), 6) + ShapeUtil.rect(-8, -14, 16, 11, ColorUtil.sh(c, -0.1), 4) + ShapeUtil.rect(-3, -12, 6, 2, t.accent, 1);
  }
}
