import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class RugAsset extends BaseAsset {
  readonly id = "rug";

  readonly kind = "floor";

  readonly w = 180;

  readonly h = 14;

  readonly tags = ["tapete", "carpet"];

  draw(p: any, t: any) { const c = ShapeUtil.col(t, p.color, t.secondary); return ShapeUtil.ell(0, -2, 90, 10, c, "opacity=\"0.22\"") + ShapeUtil.ell(0, -2, 76, 7, "none", `stroke="${c}" stroke-width="2" opacity="0.35" stroke-dasharray="6 5"`); }
}
