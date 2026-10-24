import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SunAsset extends BaseAsset {
  readonly id = "sun";

  readonly kind = "sky";

  readonly w = 90;

  readonly h = 90;

  readonly tags = ["sol"];

  draw(p: any, t: any) {
    let s = ""; for (let a = 0; a < 360; a += 30) s += `<path d="M${ShapeUtil.r(Math.cos(ShapeUtil.rad(a)) * 34)} ${ShapeUtil.r(-45 + Math.sin(ShapeUtil.rad(a)) * 34)} L${ShapeUtil.r(Math.cos(ShapeUtil.rad(a)) * 44)} ${ShapeUtil.r(-45 + Math.sin(ShapeUtil.rad(a)) * 44)}" stroke="${t.accent}" stroke-width="5" stroke-linecap="round"/>`;
    return ShapeUtil.circle(0, -45, 31, t.accent, "opacity=\"0.25\"") + s + ShapeUtil.circle(0, -45, 26, t.accent) + `<path d="M-16 -55 A20 20 0 0 1 4 -66" stroke="${ColorUtil.sh(t.accent, 0.45)}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
}
