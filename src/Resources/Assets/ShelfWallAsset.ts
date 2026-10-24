import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ShelfWallAsset extends BaseAsset {
  readonly id = "shelf_wall";

  readonly kind = "wall";

  readonly w = 90;

  readonly h = 34;

  readonly elevation = 100;

  readonly tags = ["prateleira", "wall_shelf"];

  draw(p: any, t: any) {
    return ShapeUtil.rect(-45, -6, 90, 6, t.wood, 1) + ShapeUtil.rect(-45, 0, 90, 2, ColorUtil.sh(t.wood, -0.25)) + ShapeUtil.rect(-38, -26, 7, 20, t.primary, 1) + ShapeUtil.rect(-30, -24, 6, 18, t.secondary, 1)
      + ShapeUtil.rect(-23, -27, 7, 21, t.accent, 1) + `<path d="M8 -6 L12 -18 L22 -18 L26 -6 Z" fill="${t.primary}"/>` + `<path d="M17 -18 Q10 -30 14 -36 Q18 -28 17 -18 Z M17 -18 Q24 -28 22 -34 Q16 -28 17 -18 Z" fill="${t.foliage[0]}"/>`;
  }
}
