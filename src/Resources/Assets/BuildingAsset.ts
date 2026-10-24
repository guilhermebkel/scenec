import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BuildingAsset extends BaseAsset {
  readonly id = "building";

  readonly kind = "ground";

  readonly w = 90;

  readonly h = 300;

  readonly tags = ["prédio", "predio", "tower", "skyscraper"];

  size(p: any) { return ({ w: p.width || 90, h: p.floors ? p.floors * 30 + 26 : 306 }); }

  draw(p: any, t: any) {
    const h = p.floors ? p.floors * 30 + 20 : 300, w = p.width || 90, c = ShapeUtil.col(t, p.color, t.secondary);
    let s = ShapeUtil.rect(-w / 2, -h, w, h, c) + ShapeUtil.rect(w / 2 - w * 0.28, -h, w * 0.28, h, ColorUtil.sh(c, -0.18)) + ShapeUtil.rect(-w / 2 - 4, -h - 6, w + 8, 8, ColorUtil.sh(c, -0.35));
    let i = 0;
    for (let y = -h + 20; y < -25; y += 30) for (let x = -w / 2 + 12; x < w / 2 - 14; x += 22) {
      const lit = ((i++ * 7 + Math.floor(w) + (p.seed || 0)) % 5) < 2;
      s += ShapeUtil.rect(x, y, 12, 16, lit ? t.glass : ColorUtil.sh(c, -0.35), 1) + (lit ? ShapeUtil.rect(x, y + 12, 12, 4, ColorUtil.sh(t.glass, -0.12)) : "");
    }
    return s + ShapeUtil.rect(-10, -24, 20, 24, ColorUtil.sh(c, -0.4), 2);
  }
}
