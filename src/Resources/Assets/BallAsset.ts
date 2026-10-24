import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BallAsset extends BaseAsset {
  readonly id = "ball";

  readonly kind = "ground";

  readonly w = 24;

  readonly h = 24;

  readonly tags = ["bola", "beach_ball"];

  draw(p: any, t: any) {
    return ShapeUtil.shadow(t, 10, 2) + ShapeUtil.circle(0, -12, 12, t.paper) + `<path d="M0 -24 A12 12 0 0 1 12 -12 L0 -12 Z" fill="${t.primary}"/><path d="M0 0 A12 12 0 0 1 -12 -12 L0 -12 Z" fill="${t.accent}"/>` +
        `<path d="M0 0 A12 12 0 0 0 12 -12 A12 12 0 0 1 2 -1 Z" fill="${t.ink}" opacity="0.12"/>` + ShapeUtil.circle(-5, -18, 2.5, t.paper, "opacity=\"0.7\"");
  }
}
