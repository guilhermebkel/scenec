import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class UniversityAsset extends BaseAsset {
  readonly id = "university";

  readonly kind = "ground";

  readonly width = 190;

  readonly height = 150;

  readonly tags = ["universidade", "faculdade", "campus", "museu"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.col(theme, params.color, theme.paper), darker = ColorUtil.sh(mainColor, -0.14);
    let svg = ShapeUtil.shadow(theme, 100, 5) + ShapeUtil.rect(-95, -12, 190, 12, ColorUtil.sh(mainColor, -0.2)) + ShapeUtil.rect(-90, -20, 180, 8, darker) + ShapeUtil.rect(-85, -108, 170, 90, ColorUtil.sh(mainColor, -0.06));
    for (let index = 0; index < 6; index++) { const posX = -75 + index * 30; svg += ShapeUtil.rect(posX, -100, 12, 80, mainColor) + ShapeUtil.rect(posX + 7, -100, 5, 80, darker) + ShapeUtil.rect(posX - 3, -104, 18, 5, darker) + ShapeUtil.rect(posX - 3, -22, 18, 4, darker); }
    return svg + ShapeUtil.rect(-92, -114, 184, 10, mainColor) + ShapeUtil.rect(-92, -106, 184, 3, darker)
      + `<path d="M-96 -114 L0 -150 L96 -114 Z" fill="${mainColor}"/><path d="M0 -150 L96 -114 L40 -114 Z" fill="${darker}"/><path d="M-70 -118 L0 -143 L70 -118 Z" fill="${ColorUtil.sh(mainColor, -0.08)}"/>`
      + ShapeUtil.circle(0, -127, 7, theme.accent) + ShapeUtil.rect(-12, -60, 24, 40, theme.woodDark, 2);
  }
}
