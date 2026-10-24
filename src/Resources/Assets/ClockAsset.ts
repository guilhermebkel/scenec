import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ClockAsset extends BaseAsset {
  readonly id = "clock";

  readonly kind = "wall";

  readonly w = 34;

  readonly h = 34;

  readonly elevation = 120;

  readonly tags = ["relógio", "relogio"];

  draw(p: any, t: any) {
    return ShapeUtil.circle(1, -16, 17, "rgba(0,0,0,0.08)") + ShapeUtil.circle(0, -17, 17, t.paper, `stroke="${t.ink}" stroke-width="3"`)
      + [0, 90, 180, 270].map((a) => ShapeUtil.circle(Math.cos(ShapeUtil.rad(a)) * 11.5, -17 + Math.sin(ShapeUtil.rad(a)) * 11.5, 1.2, t.ink)).join("")
      + `<path d="M0 -17 L0 -28 M0 -17 L8 -13" stroke="${t.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
}
