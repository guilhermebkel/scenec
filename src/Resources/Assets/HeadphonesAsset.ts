import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class HeadphonesAsset extends BaseAsset {
  readonly id = "headphones";

  readonly kind = "surface";

  readonly w = 10;

  readonly h = 9;

  readonly tags = ["fone", "headset", "fone de ouvido"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.ink);
    return `<path d="M-4.5 -2.5 Q-4.5 -9 0 -9 Q4.5 -9 4.5 -2.5" stroke="${c}" stroke-width="1.3" fill="none"/>` + ShapeUtil.ell(-4.2, -2.3, 2.3, 2.6, c) + ShapeUtil.ell(4.2, -2.3, 2.3, 2.6, ColorUtil.sh(c, 0.15))
      + (p.mic !== false ? `<path d="M-5.5 -3 Q-9 -6 -7.5 -11" stroke="${c}" stroke-width="0.7" fill="none"/>` + ShapeUtil.circle(-7.5, -11.2, 0.8, c) : "");
  }
}
