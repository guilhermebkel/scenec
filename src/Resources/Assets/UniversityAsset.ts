import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class UniversityAsset extends BaseAsset {
  readonly id = "university";

  readonly kind = "ground";

  readonly w = 190;

  readonly h = 150;

  readonly tags = ["universidade", "faculdade", "campus", "museu"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.paper), d = ColorUtil.sh(c, -0.14);
    let s = ShapeUtil.shadow(t, 100, 5) + ShapeUtil.rect(-95, -12, 190, 12, ColorUtil.sh(c, -0.2)) + ShapeUtil.rect(-90, -20, 180, 8, d) + ShapeUtil.rect(-85, -108, 170, 90, ColorUtil.sh(c, -0.06));
    for (let i = 0; i < 6; i++) { const x = -75 + i * 30; s += ShapeUtil.rect(x, -100, 12, 80, c) + ShapeUtil.rect(x + 7, -100, 5, 80, d) + ShapeUtil.rect(x - 3, -104, 18, 5, d) + ShapeUtil.rect(x - 3, -22, 18, 4, d); }
    return s + ShapeUtil.rect(-92, -114, 184, 10, c) + ShapeUtil.rect(-92, -106, 184, 3, d) +
          `<path d="M-96 -114 L0 -150 L96 -114 Z" fill="${c}"/><path d="M0 -150 L96 -114 L40 -114 Z" fill="${d}"/><path d="M-70 -118 L0 -143 L70 -118 Z" fill="${ColorUtil.sh(c, -0.08)}"/>` +
          ShapeUtil.circle(0, -127, 7, t.accent) + ShapeUtil.rect(-12, -60, 24, 40, t.woodDark, 2);
  }
}
