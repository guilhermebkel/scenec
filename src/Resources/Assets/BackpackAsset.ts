import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BackpackAsset extends BaseAsset {
  readonly id = "backpack";

  readonly kind = "any";

  readonly width = 26;

  readonly height = 34;

  readonly tags = ["mochila"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.col(theme, params.color, theme.secondary);
    return `<path d="M-6 -30 Q0 -38 6 -30" stroke="${ColorUtil.sh(mainColor, -0.3)}" stroke-width="2.5" fill="none"/>` + ShapeUtil.rect(-12, -30, 24, 30, mainColor, 8) + ShapeUtil.rect(2, -30, 10, 30, ColorUtil.sh(mainColor, -0.15), 6) + ShapeUtil.rect(-8, -14, 16, 11, ColorUtil.sh(mainColor, -0.1), 4) + ShapeUtil.rect(-3, -12, 6, 2, theme.accent, 1);
  }
}
