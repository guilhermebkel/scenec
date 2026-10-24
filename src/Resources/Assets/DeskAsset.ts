import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DeskAsset extends BaseAsset {
  readonly id = "desk";

  readonly kind = "ground";

  readonly w = 130;

  readonly h = 46;

  readonly top = 46;

  readonly tags = ["mesa de trabalho", "escrivaninha", "table_desk"];

  draw(p: any, t: any) {
    return ShapeUtil.shadow(t, 68, 3.5) + ShapeUtil.rect(-58, -40, 6, 40, t.woodDark) + ShapeUtil.rect(52, -40, 6, 40, t.woodDark)
      + ShapeUtil.rect(18, -40, 32, 22, t.woodDark, 2) + ShapeUtil.rect(18, -40, 32, 4, ColorUtil.sh(t.woodDark, -0.2)) + ShapeUtil.rect(30, -32, 8, 2.5, t.accent, 1)
      + ShapeUtil.rect(-65, -46, 130, 7, t.wood, 2) + ShapeUtil.rect(-65, -41, 130, 2, ColorUtil.sh(t.wood, -0.22)) + ShapeUtil.rect(-63, -46, 126, 1.5, ColorUtil.sh(t.wood, 0.2));
  }
}
