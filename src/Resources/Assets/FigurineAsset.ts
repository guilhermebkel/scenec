import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FigurineAsset extends BaseAsset {
  readonly id = "figurine";

  readonly kind = "surface";

  readonly width = 4;

  readonly height = 6;

  readonly tags = ["boneco", "miniatura", "action figure", "toy"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.col(theme, params.color, theme.primary);
    return ShapeUtil.ell(0, -0.4, 2, 0.6, ColorUtil.sh(mainColor, -0.3)) + ShapeUtil.rect(-1.4, -3.6, 2.8, 3.2, mainColor, 1) + ShapeUtil.circle(0, -4.9, 1.7, "#F0C8A0") + `<path d="M-1.8 -5.2 Q0 -7.4 1.8 -5.2 Z" fill="${ShapeUtil.col(theme, params.hair, theme.ink)}"/>` + ShapeUtil.rect(-1.9, -3.4, 0.7, 2, ColorUtil.sh(mainColor, -0.2), 0.3);
  }
}
