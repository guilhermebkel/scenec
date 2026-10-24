import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DogAsset extends BaseAsset {
  readonly id = "dog";

  readonly kind = "ground";

  readonly w = 50;

  readonly h = 36;

  readonly tags = ["cachorro", "cão", "cao", "puppy"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.wood), f = p.facing === "left" ? -1 : 1, d = ColorUtil.sh(c, -0.2);
    return `<g transform="scale(${f} 1)">` + ShapeUtil.shadow(t, 24, 3)
      + ShapeUtil.rect(-15, -14, 5, 14, d, 2) + ShapeUtil.rect(9, -14, 5, 14, d, 2)
      + ShapeUtil.ell(-1, -18, 18, 9, c) + `<path d="M-17 -20 Q-26 -30 -22 -34" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      + ShapeUtil.rect(-11, -14, 5, 14, c, 2) + ShapeUtil.rect(13, -14, 5, 14, c, 2)
      + ShapeUtil.circle(17, -29, 9, c) + ShapeUtil.ell(24, -26, 6, 4.5, ColorUtil.sh(c, 0.25)) + ShapeUtil.circle(29, -27, 2, t.ink) + ShapeUtil.circle(19, -31, 1.4, t.ink)
      + `<path d="M11 -36 Q8 -26 14 -25 Q15 -32 11 -36 Z" fill="${d}"/>` + ShapeUtil.rect(11, -22, 10, 3, t.primary, 1.5) + `</g>`;
  }
}
