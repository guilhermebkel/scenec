import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PineAsset extends BaseAsset {
  readonly id = "pine";

  readonly kind = "ground";

  readonly w = 80;

  readonly h = 200;

  readonly tags = ["pinheiro", "pine_tree", "conifer"];

  draw(p: any, t: any) {
    let [a, , c] = t.foliage; if (p.color) { a = ShapeUtil.col(t, p.color, a); c = ColorUtil.sh(a, -0.12); }
    const tri = (y0: any, y1: any, hw: any, colr: any) => `<path d="M${-hw} ${y0} L0 ${y1} L${hw} ${y0} Z" fill="${colr}"/><path d="M0 ${y1} L${hw} ${y0} L0 ${y0} Z" fill="${ColorUtil.sh(colr, -0.15)}"/>`;
    return ShapeUtil.shadow(t, 32, 3.5) + ShapeUtil.rect(-6, -30, 12, 30, t.trunk) + ShapeUtil.rect(0, -30, 6, 30, ColorUtil.sh(t.trunk, -0.2))
      + tri(-30, -95, 40, c) + tri(-80, -145, 33, a) + tri(-128, -195, 25, c);
  }
}
