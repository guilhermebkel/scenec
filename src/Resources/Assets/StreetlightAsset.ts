import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class StreetlightAsset extends BaseAsset {
  readonly id = "streetlight";

  readonly kind = "ground";

  readonly w = 40;

  readonly h = 170;

  readonly tags = ["poste", "lamppost", "street_lamp"];

  draw(p: any, t: any) {
    return ShapeUtil.shadow(t, 10, 2) + `<path d="M0 0 L0 -160 Q0 -170 14 -170" stroke="${t.metal}" stroke-width="5" fill="none"/>` + ShapeUtil.rect(8, -174, 20, 8, t.metal, 3)
      + `<path d="M10 -166 L-30 0 L70 0 L26 -166 Z" fill="#FFE39A" opacity="0.12"/>` + ShapeUtil.circle(18, -165, 4, "#FFE9A8");
  }
}
