import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SchoolAsset extends BaseAsset {
  readonly id = "school";

  readonly kind = "ground";

  readonly width = 170;

  readonly height = 150;

  readonly tags = ["escola", "colégio", "colegio"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.col(theme, params.color, theme.primary), roof = theme.secondary;
    return ShapeUtil.shadow(theme, 92, 5)
      + ShapeUtil.rect(-80, -86, 160, 86, mainColor) + ShapeUtil.rect(30, -86, 50, 86, ColorUtil.sh(mainColor, -0.12)) + ShapeUtil.rect(-80, -90, 160, 6, ColorUtil.sh(mainColor, -0.3))
      + ShapeUtil.rect(-28, -122, 56, 40, mainColor) + ShapeUtil.rect(10, -122, 18, 40, ColorUtil.sh(mainColor, -0.12))
      + `<path d="M-36 -120 L0 -146 L36 -120 Z" fill="${roof}"/><path d="M0 -146 L36 -120 L14 -120 Z" fill="${ColorUtil.sh(roof, -0.18)}"/>`
      + ShapeUtil.circle(0, -106, 9, theme.paper, `stroke="${ColorUtil.sh(mainColor, -0.35)}" stroke-width="2"`) + `<path d="M0 -106 L0 -112 M0 -106 L4 -104" stroke="${theme.ink}" stroke-width="1.6" stroke-linecap="round"/>`
      + ShapeUtil.rect(-14, -46, 28, 46, theme.woodDark, 2) + ShapeUtil.rect(0, -46, 14, 46, ColorUtil.sh(theme.woodDark, -0.15))
      + [-66, -44, 24, 46].map((posX) => ShapeUtil.rect(posX, -70, 18, 18, theme.glass, 2, `stroke="${theme.paper}" stroke-width="2.5"`)).join("")
      + [-66, -44, 24, 46].map((coordX) => ShapeUtil.rect(coordX, -40, 18, 18, theme.glass, 2, `stroke="${theme.paper}" stroke-width="2.5"`)).join("")
      + `<path d="M60 -86 L60 -150" stroke="${theme.metal}" stroke-width="2.5"/><path d="M60 -150 L82 -144 L60 -137 Z" fill="${theme.accent}"/>`;
  }
}
