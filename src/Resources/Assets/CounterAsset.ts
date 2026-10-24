import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CounterAsset extends BaseAsset {
  readonly id = "counter";

  readonly kind = "ground";

  readonly w = 220;

  readonly h = 62;

  readonly top = 62;

  readonly tags = ["balcão", "balcao", "bar", "kitchen_counter"];

  draw(p: any, t: any) {
    return ShapeUtil.shadow(t, 112, 4) + ShapeUtil.rect(-104, -54, 208, 54, t.wood) + ShapeUtil.rect(-104, -54, 208, 6, ColorUtil.sh(t.wood, -0.22))
      + [-70, 0, 70].map((x) => ShapeUtil.rect(x - 28, -44, 56, 38, ColorUtil.sh(t.wood, -0.12), 3) + ShapeUtil.rect(x - 8, -40, 16, 2.5, t.metal, 1)).join("")
      + ShapeUtil.rect(-110, -62, 220, 8, t.woodDark, 2) + ShapeUtil.rect(-108, -62, 216, 1.5, ColorUtil.sh(t.woodDark, 0.25));
  }
}
