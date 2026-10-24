import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BookshelfAsset extends BaseAsset {
  readonly id = "bookshelf";

  readonly kind = "ground";

  readonly w = 80;

  readonly h = 170;

  readonly tags = ["estante", "shelf", "books"];

  draw(p: any, t: any) {
    let s = ShapeUtil.shadow(t, 44, 3) + ShapeUtil.rect(-40, -170, 80, 170, t.woodDark, 2) + ShapeUtil.rect(-35, -165, 70, 160, ColorUtil.sh(t.wood, -0.1));
    const cols = [t.primary, t.secondary, t.accent, t.paper, t.primary, t.secondary];
    for (let row = 0; row < 4; row++) {
      const base = -10 - row * 40; let x = -33, k = row;
      s += ShapeUtil.rect(-35, base - 36, 70, 6, "rgba(0,0,0,0.12)");
      while (x < 26) { const w = 6 + ((k * 5) % 5), h = 22 + ((k * 7) % 9), c = cols[k % cols.length]; s += ShapeUtil.rect(x, base - h, w, h, c, 1) + ShapeUtil.rect(x + w * 0.6, base - h, w * 0.4, h, ColorUtil.sh(c, -0.15)) + ShapeUtil.rect(x, base - h + 4, w, 1.5, ColorUtil.sh(c, -0.3)); x += w + 1; k++; }
      s += ShapeUtil.rect(-35, base, 70, 5, t.woodDark);
    }
    return s + ShapeUtil.rect(26, -170, 14, 170, ColorUtil.sh(t.woodDark, -0.15));
  }
}
