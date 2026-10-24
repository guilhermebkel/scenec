import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LaptopAsset extends BaseAsset {
  readonly id = "laptop";

  readonly kind = "surface";

  readonly w = 34;

  readonly h = 24;

  readonly tags = ["notebook", "computador", "computer"];

  draw(p: any, t: any) {
    const f = p.facing === "left" ? -1 : 1;
    return ShapeUtil.rect(-17, -3, 34, 3, t.metal, 1.5) + ShapeUtil.rect(-17, -1.5, 34, 1.5, ColorUtil.sh(t.metal, -0.25))
      + `<path d="M${-f * 15} -3 L${-f * 19} -25" stroke="${t.ink}" stroke-width="3.5" stroke-linecap="round"/><path d="M${-f * 13} -5 L${-f * 16.5} -23" stroke="${t.glass}" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>`;
  }
}
