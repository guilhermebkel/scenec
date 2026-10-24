import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DrawerUnitAsset extends BaseAsset {
  readonly id = "drawer_unit";

  readonly kind = "ground";

  readonly w = 26;

  readonly h = 42;

  readonly tags = ["gaveteiro", "gavetas", "drawers"];

  size(p: any) { return ({ w: p.width || 26, h: p.height || 42 }); }

  draw(p: any, t: any) {
    const w = p.width || 26, h = p.height || 42, n = p.drawers || 4, c = ShapeUtil.col(t, p.color, t.wood), plinth = 2.5;
    let s = ShapeUtil.shadow(t, w * 0.55, 1.8) + ShapeUtil.rect(-w / 2, -h, w, h, ColorUtil.sh(c, -0.08)) + ShapeUtil.rect(-w / 2, -plinth, w, plinth, ColorUtil.sh(c, -0.25));
    const dh = (h - plinth - 1) / n;
    for (let i = 0; i < n; i++) {
      const y = -h + 0.6 + i * dh;
      s += ShapeUtil.rect(-w / 2 + 0.8, y, w - 1.6, dh - 0.7, c, 0.6) + ShapeUtil.rect(-w / 2 + 0.8, y + dh - 1.4, w - 1.6, 0.7, ColorUtil.sh(c, -0.15)) +
            ShapeUtil.rect(-w * 0.28, y + dh * 0.42, w * 0.56, 0.8, t.metal, 0.4) + ShapeUtil.rect(-w * 0.28, y + dh * 0.42 + 0.6, w * 0.56, 0.35, ColorUtil.sh(t.metal, -0.3));
    }
    return s;
  }
}
