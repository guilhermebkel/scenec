import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LightSwitchAsset extends BaseAsset {
  readonly id = "light_switch";

  readonly kind = "wall";

  readonly w = 5;

  readonly h = 7;

  readonly elevation = 110;

  readonly tags = ["interruptor", "tomada", "switch"];

  draw(p: any, t: any) { return ShapeUtil.rect(-2.4, -7, 5, 7, "rgba(0,0,0,0.08)", 0.6) + ShapeUtil.rect(-2.5, -7.2, 5, 7, t.paper, 0.6) + ShapeUtil.rect(-1, -5.2, 2, 3, ColorUtil.sh(t.paper, -0.08), 0.4); }
}
