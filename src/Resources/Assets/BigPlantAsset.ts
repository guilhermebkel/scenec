import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BigPlantAsset extends BaseAsset {
  readonly id = "big_plant";

  readonly kind = "ground";

  readonly w = 60;

  readonly h = 110;

  readonly tags = ["planta grande", "costela de adão", "monstera"];

  draw(p: any, t: any) {
    const [a, b, c] = t.foliage; const pot = ShapeUtil.col(t, p.pot, "#C9724E");
    const lf = (x: any, y: any, rot: any, colr: any) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="22" fill="${colr}" transform="rotate(${rot} ${x} ${y})"/><path d="M${x} ${y + 20} L${x} ${y - 18}" stroke="${ColorUtil.sh(colr, -0.2)}" stroke-width="1.4" transform="rotate(${rot} ${x} ${y})"/>`;
    return ShapeUtil.shadow(t, 22, 3) + lf(-16, -64, -35, c) + lf(16, -66, 35, b) + lf(0, -86, 0, a) + lf(-24, -88, -50, a) + lf(24, -90, 48, c) + lf(-6, -58, -12, b) +
          `<path d="M-16 -34 L16 -34 L12 0 L-12 0 Z" fill="${pot}"/><path d="M4 -34 L16 -34 L12 0 L4 0 Z" fill="${ColorUtil.sh(pot, -0.12)}"/>` + ShapeUtil.rect(-17, -36, 34, 5, ColorUtil.sh(pot, -0.2), 2);
  }
}
