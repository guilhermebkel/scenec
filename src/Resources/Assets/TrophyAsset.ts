import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TrophyAsset extends BaseAsset {
  readonly id = "trophy";

  readonly kind = "surface";

  readonly width = 24;

  readonly height = 30;

  readonly tags = ["troféu", "trofeu", "prêmio"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-9, -4, 18, 4, theme.woodDark, { rx: 1 }) + ShapeUtil.rect(-3, -12, 6, 8, theme.accent)
      + `<path d="M-10 -30 L10 -30 Q10 -14 0 -12 Q-10 -14 -10 -30 Z" fill="${theme.accent}"/><path d="M2 -30 L10 -30 Q10 -14 0 -12 Z" fill="${ColorUtil.sh(theme.accent, -0.15)}"/>`
      + `<path d="M-10 -27 Q-16 -27 -14 -21 Q-12 -17 -8 -18 M10 -27 Q16 -27 14 -21 Q12 -17 8 -18" stroke="${theme.accent}" stroke-width="2" fill="none"/>`;
  }
}
