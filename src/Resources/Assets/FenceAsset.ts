import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FenceAsset extends BaseAsset {
  readonly id = "fence";

  readonly kind = "ground";

  readonly width = 160;

  readonly height = 40;

  readonly tags = ["cerca"];

  draw(params: AssetParams, theme: Theme) {
    let svg = ShapeUtil.rect(-80, -30, 160, 5, theme.paper) + ShapeUtil.rect(-80, -15, 160, 5, theme.paper) + ShapeUtil.rect(-80, -25, 160, 2, ColorUtil.sh(theme.paper, -0.15)) + ShapeUtil.rect(-80, -10, 160, 2, ColorUtil.sh(theme.paper, -0.15));
    for (let posX = -76; posX <= 70; posX += 18) { svg += `<path d="M${posX} 0 L${posX} -34 L${posX + 5} -40 L${posX + 10} -34 L${posX + 10} 0 Z" fill="${theme.paper}"/><path d="M${posX + 6} 0 L${posX + 6} -38 L${posX + 10} -34 L${posX + 10} 0 Z" fill="${ColorUtil.sh(theme.paper, -0.12)}"/>`; }
    return svg;
  }
}
