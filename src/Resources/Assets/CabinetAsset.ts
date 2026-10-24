import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CabinetAsset extends BaseAsset {
  readonly id = "cabinet";

  readonly kind = "ground";

  readonly w = 40;

  readonly h = 36;

  readonly tags = ["armário", "armario", "gabinete", "cabinet"];

  size(p: any) { return ({ w: p.width || 40, h: p.height || 36 }); }

  draw(p: any, t: any) {
    const w = p.width || 40, h = p.height || 36, n = p.doors || 2, c = ShapeUtil.col(t, p.color, t.wood), plinth = 2;
    let s = ShapeUtil.shadow(t, w * 0.52, 1.8) + ShapeUtil.rect(-w / 2, -h, w, h, ColorUtil.sh(c, -0.1)) + ShapeUtil.rect(-w / 2 + 1, -plinth, w - 2, plinth, ColorUtil.sh(c, -0.3));
    const dw = (w - 1) / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.5 + i * dw;
      s += ShapeUtil.rect(x + 0.3, -h + 0.5, dw - 0.6, h - plinth - 0.8, c, 0.4) + ShapeUtil.rect(x + dw - 1.2, -h + 0.5, 0.9, h - plinth - 0.8, ColorUtil.sh(c, -0.12));
      const hx = i < n / 2 ? x + dw - 2.6 : x + 1.8;
      if (n > 1 || p.handle !== false) { s += ShapeUtil.rect(hx, -h * 0.72, 0.8, h * 0.3, t.metal, 0.4); }
    }
    return s;
  }
}
