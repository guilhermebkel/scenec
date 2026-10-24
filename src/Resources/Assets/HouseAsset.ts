import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class HouseAsset extends BaseAsset {
  readonly id = "house";

  readonly kind = "ground";

  readonly w = 160;

  readonly h = 175;

  readonly tags = ["casa", "home"];

  draw(p: any, t: any) {
    const body = ShapeUtil.col(t, p.color, t.primary), roof = t.secondary;
    return ShapeUtil.shadow(t, 88, 5)
      + ShapeUtil.rect(40, -150, 16, 32, t.woodDark) + ShapeUtil.rect(48, -150, 8, 32, ColorUtil.sh(t.woodDark, -0.2)) + ShapeUtil.rect(38, -154, 20, 6, ColorUtil.sh(t.woodDark, -0.1), 1)
      + ShapeUtil.rect(-65, -100, 130, 100, body) + ShapeUtil.rect(25, -100, 40, 100, ColorUtil.sh(body, -0.12))
      + `<path d="M-65 -100 L65 -100 L65 -92 L-65 -92 Z" fill="${ColorUtil.sh(body, -0.28)}" opacity="0.6"/>`
      + `<path d="M-80 -95 L0 -170 L80 -95 Z" fill="${roof}"/><path d="M0 -170 L80 -95 L40 -95 Z" fill="${ColorUtil.sh(roof, -0.18)}"/>`
      + `<path d="M-84 -92 L0 -172 L84 -92" stroke="${ColorUtil.sh(roof, -0.3)}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`
      + ShapeUtil.rect(-15, -56, 30, 56, t.woodDark, 3) + ShapeUtil.rect(2, -56, 13, 56, ColorUtil.sh(t.woodDark, -0.15), 0) + ShapeUtil.circle(9, -28, 2, t.accent) + ShapeUtil.rect(-19, -2, 38, 3, ColorUtil.sh(body, -0.35))
      + [[-52, -80], [26, -80]].map(([x, y]) => ShapeUtil.rect(x, y, 26, 24, t.glass, 2, `stroke="${t.paper}" stroke-width="3"`)
        + `<path d="M${x + 4} ${y + 18} L${x + 14} ${y + 4}" stroke="${t.paper}" stroke-width="2.5" opacity="0.6"/>` + ShapeUtil.rect(x - 3, y + 24, 32, 3, t.paper, 1)).join("")
      + ShapeUtil.circle(0, -122, 9, t.glass, `stroke="${t.paper}" stroke-width="3"`);
  }
}
