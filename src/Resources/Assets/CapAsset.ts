import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CapAsset extends BaseAsset {
  readonly id = "cap";

  readonly kind = "surface";

  readonly w = 10;

  readonly h = 6;

  readonly tags = ["boné", "bone", "baseball cap"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.ink);
    return `<path d="M-5 -1 Q-5 -6.5 0 -6.5 Q5 -6.5 5 -1 Z" fill="${c}"/><path d="M-1 -1 L6.5 -0.2 Q6.5 0.6 5 0.6 L-1 0.2 Z" fill="${ColorUtil.sh(c, 0.12)}"/>` +
          ShapeUtil.rect(-2.5, -4.8, 5, 2.2, ShapeUtil.col(t, p.logo, t.accent), 0.4) + ShapeUtil.rect(-1.8, -4.2, 3.6, 0.5, t.paper);
  }
}
