import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CupAsset extends BaseAsset {
  readonly id = "cup";

  readonly kind = "surface";

  readonly width = 16;

  readonly height = 22;

  readonly tags = ["xícara", "xicara", "caneca", "mug", "coffee"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.col(theme, params.color, theme.paper);
    return ShapeUtil.ell(0, 0, 9, 1.6, ColorUtil.sh(mainColor, -0.2)) + `<path d="M-6 -12 L6 -12 L5 0 L-5 0 Z" fill="${mainColor}"/><path d="M1 -12 L6 -12 L5 0 L1 0 Z" fill="${ColorUtil.sh(mainColor, -0.12)}"/>` + ShapeUtil.ell(0, -12, 6, 1.4, theme.woodDark)
      + `<path d="M6 -10 Q11 -9 10 -5 Q9 -3 5.5 -3" stroke="${mainColor}" stroke-width="2" fill="none"/>`
      + (params.steam === false ? "" : `<path d="M-2 -15 Q-5 -19 -2 -22 Q1 -25 -2 -28 M3 -15 Q0 -19 3 -22" stroke="${theme.metal}" stroke-width="1.3" fill="none" opacity="0.6" stroke-linecap="round"/>`);
  }
}
