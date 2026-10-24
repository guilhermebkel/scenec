import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class UmbrellaAsset extends BaseAsset {
  readonly id = "umbrella";

  readonly kind = "ground";

  readonly width = 140;

  readonly height = 150;

  readonly tags = ["guarda-sol", "parasol", "beach_umbrella"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.primary);
    return ShapeUtil.shadow(theme, 55, 5)
      + `<path d="M0 0 L8 -135" stroke="${theme.ink}" stroke-width="4" stroke-linecap="round"/>`
      + `<path d="M-58 -112 Q8 -175 74 -128 Z" fill="${mainColor}"/>`
      + `<path d="M-14 -126 Q8 -172 30 -122 Z" fill="${theme.paper}"/>`
      + `<path d="M-58 -112 Q-30 -118 -14 -126 Q8 -120 30 -122 Q52 -124 74 -128" fill="none" stroke="${ColorUtil.sh(mainColor, -0.25)}" stroke-width="3"/>`
      + `<path d="M-58 -112 Q-36 -132 -14 -126 L-58 -112 Z" fill="${ColorUtil.sh(mainColor, 0.15)}" opacity="0.5"/>`;
  }
}
