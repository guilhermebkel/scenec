import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TvStandAsset extends BaseAsset {
  readonly id = "tv_stand";

  readonly kind = "ground";

  readonly w = 120;

  readonly h = 40;

  readonly top = 40;

  readonly tags = ["rack", "móvel de tv", "tv_cabinet"];

  draw(p: any, t: any) {
    return ShapeUtil.shadow(t, 60, 3) + ShapeUtil.rect(-60, -40, 120, 36, t.wood, 3) + ShapeUtil.rect(-60, -40, 120, 4, ColorUtil.sh(t.wood, 0.15), 2) + ShapeUtil.rect(-54, -32, 52, 24, ColorUtil.sh(t.wood, -0.12), 2) + ShapeUtil.rect(2, -32, 52, 24, ColorUtil.sh(t.wood, -0.12), 2)
      + ShapeUtil.rect(-30, -22, 10, 2.5, t.metal, 1) + ShapeUtil.rect(22, -22, 10, 2.5, t.metal, 1) + ShapeUtil.rect(-56, -4, 6, 4, t.woodDark) + ShapeUtil.rect(50, -4, 6, 4, t.woodDark);
  }
}
