import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BalloonsAsset extends BaseAsset {
  readonly id = "balloons";

  readonly kind = "ground";

  readonly w = 40;

  readonly h = 100;

  readonly tags = ["balões", "baloes", "festa", "party"];

  draw(p: any, t: any) {
    const cs = [t.primary, t.accent, t.secondary];
    return `<path d="M0 0 Q-6 -40 -12 -70 M0 0 Q2 -45 4 -82 M0 0 Q8 -36 16 -66" stroke="${t.metal}" stroke-width="1" fill="none"/>`
      + [[-12, -78, cs[0]], [4, -91, cs[1]], [16, -74, cs[2]]].map(([x, y, c]) => ShapeUtil.ell(x, y, 9, 11, c) + ShapeUtil.ell(x - 3, y - 4, 2.5, 3.5, t.paper, "opacity=\"0.45\"")).join("");
  }
}
