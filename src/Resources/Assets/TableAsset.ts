import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TableAsset extends BaseAsset {
  readonly id = "table";

  readonly kind = "ground";

  readonly w = 80;

  readonly h = 46;

  readonly top = 46;

  readonly tags = ["mesa", "mesa redonda", "cafe_table", "dining_table"];

  draw(p: any, t: any) {
    const w = p.width || 80; return ShapeUtil.shadow(t, w / 2, 3.5) + ShapeUtil.rect(-3.5, -40, 7, 37, t.metal) + ShapeUtil.rect(0, -40, 3.5, 37, ColorUtil.sh(t.metal, -0.2))
      + `<path d="M-20 0 Q0 -8 20 0 Z" fill="${t.metal}"/>` + ShapeUtil.rect(-w / 2, -46, w, 6, t.wood, 3) + ShapeUtil.rect(-w / 2, -42, w, 2, ColorUtil.sh(t.wood, -0.22));
  }

  size(p: any) { return ({ w: p.width || 80, h: 46 }); }
}
