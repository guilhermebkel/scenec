import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BedAsset extends BaseAsset {
  readonly id = "bed";

  readonly kind = "ground";

  readonly w = 180;

  readonly h = 70;

  readonly top = 38;

  readonly seat = 38;

  readonly tags = ["cama", "bed"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.primary);
    return ShapeUtil.shadow(t, 90, 4) + ShapeUtil.rect(-90, -70, 10, 70, t.woodDark, 3) + ShapeUtil.rect(80, -46, 10, 46, t.woodDark, 3)
      + ShapeUtil.rect(-82, -34, 166, 22, t.paper, 4) + ShapeUtil.rect(-82, -16, 166, 6, ColorUtil.sh(t.paper, -0.12)) + ShapeUtil.rect(-76, -46, 40, 14, t.paper, 7) + ShapeUtil.rect(-76, -38, 40, 6, ColorUtil.sh(t.paper, -0.1), 3)
      + `<path d="M-30 -40 Q20 -44 84 -38 L84 -14 L-34 -14 Z" fill="${c}"/><path d="M-30 -22 L84 -22 L84 -14 L-34 -14 Z" fill="${ColorUtil.sh(c, -0.15)}"/>` + ShapeUtil.rect(-84, -10, 168, 4, t.woodDark, 1);
  }
}
