import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TrophyAsset extends BaseAsset {
  readonly id = "trophy";

  readonly kind = "surface";

  readonly w = 24;

  readonly h = 30;

  readonly tags = ["troféu", "trofeu", "prêmio"];

  draw(p: any, t: any) {
    return ShapeUtil.rect(-9, -4, 18, 4, t.woodDark, 1) + ShapeUtil.rect(-3, -12, 6, 8, t.accent) + `<path d="M-10 -30 L10 -30 Q10 -14 0 -12 Q-10 -14 -10 -30 Z" fill="${t.accent}"/><path d="M2 -30 L10 -30 Q10 -14 0 -12 Z" fill="${ColorUtil.sh(t.accent, -0.15)}"/>` +
        `<path d="M-10 -27 Q-16 -27 -14 -21 Q-12 -17 -8 -18 M10 -27 Q16 -27 14 -21 Q12 -17 8 -18" stroke="${t.accent}" stroke-width="2" fill="none"/>`;
  }
}
