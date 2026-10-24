import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CatAsset extends BaseAsset {
  readonly id = "cat";

  readonly kind = "ground";

  readonly w = 36;

  readonly h = 32;

  readonly tags = ["gato", "gatinho", "kitten"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.metal), f = p.facing === "left" ? -1 : 1;
    return `<g transform="scale(${f} 1)">` + ShapeUtil.shadow(t, 16, 2.5) +
          `<path d="M-12 -4 Q-24 -8 -20 -22" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
          `<path d="M-12 0 Q-14 -20 0 -22 Q10 -22 10 0 Z" fill="${c}"/><path d="M2 0 Q4 -16 0 -22 Q10 -22 10 0 Z" fill="${ColorUtil.sh(c, -0.15)}"/>` +
          ShapeUtil.circle(4, -26, 8, c) + `<path d="M-2 -30 L-3 -38 L3 -32 Z M6 -32 L11 -38 L11 -30 Z" fill="${c}"/>` +
          ShapeUtil.circle(2, -27, 1.3, t.ink) + ShapeUtil.circle(8, -27, 1.3, t.ink) + `<path d="M5 -24 L4 -23 M5 -24 L6 -23" stroke="${t.ink}" stroke-width="0.8"/>` + `</g>`;
  }
}
