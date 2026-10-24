import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FlowersAsset extends BaseAsset {
  readonly id = "flowers";

  readonly kind = "ground";

  readonly w = 50;

  readonly h = 30;

  readonly tags = ["flores", "canteiro", "flower_bed"];

  draw(p: any, t: any) {
    const [a, b] = t.foliage; let s = ShapeUtil.shadow(t, 24, 2.5);
    [[-16, -16, t.primary], [-4, -24, t.accent], [9, -18, t.paper], [19, -12, t.primary], [-20, -8, t.accent]].forEach(([x, y, c]) => {
      s += `<path d="M${x} 0 Q${x + 1} ${y / 2} ${x} ${y}" stroke="${b}" stroke-width="2" fill="none"/>` + [0, 72, 144, 216, 288].map((g) => ShapeUtil.circle(x + Math.cos(ShapeUtil.rad(g)) * 3, y + Math.sin(ShapeUtil.rad(g)) * 3, 2.6, c)).join("") + ShapeUtil.circle(x, y, 1.8, t.accent === c ? t.paper : t.accent);
    });
    return s + ShapeUtil.ell(0, -2, 24, 4, a);
  }
}
