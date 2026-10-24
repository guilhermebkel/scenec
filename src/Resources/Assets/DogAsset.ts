import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DogAsset extends BaseAsset {
  readonly id = "dog";

  readonly kind = "ground";

  readonly width = 50;

  readonly height = 36;

  readonly tags = ["cachorro", "cão", "cao", "puppy"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.col(theme, params.color, theme.wood), flip = params.facing === "left" ? -1 : 1, darker = ColorUtil.sh(mainColor, -0.2);
    return `<g transform="scale(${flip} 1)">` + ShapeUtil.shadow(theme, 24, 3)
      + ShapeUtil.rect(-15, -14, 5, 14, darker, 2) + ShapeUtil.rect(9, -14, 5, 14, darker, 2)
      + ShapeUtil.ell(-1, -18, 18, 9, mainColor) + `<path d="M-17 -20 Q-26 -30 -22 -34" stroke="${mainColor}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      + ShapeUtil.rect(-11, -14, 5, 14, mainColor, 2) + ShapeUtil.rect(13, -14, 5, 14, mainColor, 2)
      + ShapeUtil.circle(17, -29, 9, mainColor) + ShapeUtil.ell(24, -26, 6, 4.5, ColorUtil.sh(mainColor, 0.25)) + ShapeUtil.circle(29, -27, 2, theme.ink) + ShapeUtil.circle(19, -31, 1.4, theme.ink)
      + `<path d="M11 -36 Q8 -26 14 -25 Q15 -32 11 -36 Z" fill="${darker}"/>` + ShapeUtil.rect(11, -22, 10, 3, theme.primary, 1.5) + `</g>`;
  }
}
