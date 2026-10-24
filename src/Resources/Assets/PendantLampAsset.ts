import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PendantLampAsset extends BaseAsset {
  readonly id = "pendant_lamp";

  readonly kind = "ceiling";

  readonly w = 40;

  readonly h = 30;

  readonly tags = ["luminária pendente", "hanging_lamp"];

  draw(p: any, t: any) {
    return `<path d="M-20 -2 Q-20 -26 0 -26 Q20 -26 20 -2 Z" fill="${t.accent}"/><path d="M4 -26 Q20 -26 20 -2 L8 -2 Z" fill="${ColorUtil.sh(t.accent, -0.15)}"/>` + ShapeUtil.circle(0, -1, 5, "#FFF3C4")
      + `<path d="M-18 0 L-50 70 L50 70 L18 0 Z" fill="#FFE9A8" opacity="0.13"/>`;
  }
}
