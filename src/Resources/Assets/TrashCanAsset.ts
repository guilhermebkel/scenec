import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TrashCanAsset extends BaseAsset {
  readonly id = "trash_can";

  readonly kind = "ground";

  readonly w = 9;

  readonly h = 15;

  readonly tags = ["lixeira", "cesto de lixo", "bin"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, "#C9CCD0");
    return ShapeUtil.shadow(t, 5.5, 1) + ShapeUtil.rect(-4.5, -13.5, 9, 13, c, 1.2) + ShapeUtil.rect(-4.5, -13.5, 2.2, 13, ColorUtil.sh(c, 0.35), 1) + ShapeUtil.rect(1.8, -13.5, 2.7, 13, ColorUtil.sh(c, -0.22), 1)
      + ShapeUtil.ell(0, -13.6, 4.6, 1.2, ColorUtil.sh(c, -0.1)) + ShapeUtil.rect(-4.7, -15, 9.4, 1.8, ColorUtil.sh(c, -0.05), 0.8) + ShapeUtil.rect(-1.5, -1.5, 3, 1.5, t.ink, 0.5);
  }
}
