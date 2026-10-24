import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CatAsset extends BaseAsset {
  readonly id = "cat";

  readonly kind = "ground";

  readonly width = 36;

  readonly height = 32;

  readonly tags = ["gato", "gatinho", "kitten"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.col(theme, params.color, theme.metal), flip = params.facing === "left" ? -1 : 1;
    return `<g transform="scale(${flip} 1)">` + ShapeUtil.shadow(theme, 16, 2.5)
      + `<path d="M-12 -4 Q-24 -8 -20 -22" stroke="${mainColor}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      + `<path d="M-12 0 Q-14 -20 0 -22 Q10 -22 10 0 Z" fill="${mainColor}"/><path d="M2 0 Q4 -16 0 -22 Q10 -22 10 0 Z" fill="${ColorUtil.sh(mainColor, -0.15)}"/>`
      + ShapeUtil.circle(4, -26, 8, mainColor) + `<path d="M-2 -30 L-3 -38 L3 -32 Z M6 -32 L11 -38 L11 -30 Z" fill="${mainColor}"/>`
      + ShapeUtil.circle(2, -27, 1.3, theme.ink) + ShapeUtil.circle(8, -27, 1.3, theme.ink) + `<path d="M5 -24 L4 -23 M5 -24 L6 -23" stroke="${theme.ink}" stroke-width="0.8"/>` + `</g>`;
  }
}
