import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PalmAsset extends BaseAsset {
  readonly id = "palm";

  readonly kind = "ground";

  readonly w = 200;

  readonly h = 262;

  readonly tags = ["palmeira", "coqueiro", "palm_tree"];

  draw(p: any, t: any) {
    const [a, b] = t.foliage;
    const leaf = (ang: any, len: any, colr: any) => {
      const x = Math.cos(ShapeUtil.rad(ang)) * len, y = -Math.sin(ShapeUtil.rad(ang)) * len;
      return `<path d="M30 -200 Q${ShapeUtil.r(30 + x * 0.5)} ${ShapeUtil.r(-200 + y * 0.5 - 25)} ${ShapeUtil.r(30 + x)} ${ShapeUtil.r(-200 + y)} Q${ShapeUtil.r(30 + x * 0.45)} ${ShapeUtil.r(-200 + y * 0.45 - 4)} 30 -200 Z" fill="${colr}"/>` +
            `<path d="M30 -200 Q${ShapeUtil.r(30 + x * 0.5)} ${ShapeUtil.r(-200 + y * 0.5 - 18)} ${ShapeUtil.r(30 + x)} ${ShapeUtil.r(-200 + y)}" stroke="${ColorUtil.sh(colr, -0.2)}" stroke-width="1.5" fill="none"/>`;
    };
    let trunk = `<path d="M-8 0 Q-6 -110 26 -200 L34 -198 Q6 -110 8 0 Z" fill="${t.trunk}"/>`;
    for (let i = 1; i < 9; i++) { const y = -i * 22, x = -7 + (i / 9) ** 2 * 33; trunk += `<path d="M${ShapeUtil.r(x - 1)} ${y} l9 -3" stroke="${ColorUtil.sh(t.trunk, -0.22)}" stroke-width="2" stroke-linecap="round"/>`; }
    return ShapeUtil.shadow(t, 40, 4.5) + trunk + [15, 40, 140, 165, 195, -15].map((g, i) => leaf(g, 70, i % 2 ? a : b)).join("") +
          leaf(90, 55, a) + ShapeUtil.circle(26, -194, 6, t.woodDark) + ShapeUtil.circle(35, -192, 6, ColorUtil.sh(t.woodDark, -0.15));
  }
}
