import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class VaseFlowersAsset extends BaseAsset {
  readonly id = "vase_flowers";

  readonly kind = "surface";

  readonly width = 22;

  readonly height = 34;

  readonly tags = ["vaso de flores", "buquê", "flower vase"];

  draw(params: AssetParams, theme: Theme) {
    return `<path d="M0 -14 Q-6 -24 -8 -30 M0 -14 Q2 -26 1 -32 M0 -14 Q6 -24 9 -28" stroke="${theme.foliage[1]}" stroke-width="1.5" fill="none"/>`
      + ShapeUtil.circle(-8, -31, 3.5, theme.primary) + ShapeUtil.circle(1, -33, 3.5, theme.accent)
      + ShapeUtil.circle(9, -29, 3.5, theme.primary)
      + `<path d="M-5 -14 L5 -14 Q8 -7 4 0 L-4 0 Q-8 -7 -5 -14 Z" fill="${theme.glass}" opacity="0.85"/><path d="M1 -14 L5 -14 Q8 -7 4 0 L1 0 Z" fill="${ColorUtil.sh(theme.glass, -0.15)}"/>`;
  }
}
