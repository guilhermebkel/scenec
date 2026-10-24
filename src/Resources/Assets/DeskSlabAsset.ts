import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DeskSlabAsset extends BaseAsset {
  readonly id = "desk_slab";

  readonly kind = "ground";

  readonly hollow = true;

  readonly w = 120;

  readonly h = 46;

  readonly top = 46;

  readonly tags = ["tampo", "bancada", "desk top", "mesa planejada"];

  size(p: any) { return ({ w: p.width || 120, h: p.height || 46 }); }

  topOf(p: any) { return p.height || 46; }

  draw(p: any, t: any) {
    const w = p.width || 120, h = p.height || 46, th = p.thickness || 4, c = ShapeUtil.col(t, p.color, t.wood);
    let s = ShapeUtil.rect(-w / 2, -h, w, th, c) + ShapeUtil.rect(-w / 2, -h + th - 1.2, w, 1.2, ColorUtil.sh(c, -0.18)) + ShapeUtil.rect(-w / 2, -h, w, 0.8, ColorUtil.sh(c, 0.25));
    const ends = p.ends || "none";
    if (ends === "left" || ends === "both") { s = ShapeUtil.rect(-w / 2, -h, 3, h, ColorUtil.sh(c, -0.06)) + ShapeUtil.rect(-w / 2 + 2, -h, 1, h, ColorUtil.sh(c, -0.2)) + s; }
    if (ends === "right" || ends === "both") { s = ShapeUtil.rect(w / 2 - 3, -h, 3, h, ColorUtil.sh(c, -0.12)) + s; }
    return s;
  }
}
