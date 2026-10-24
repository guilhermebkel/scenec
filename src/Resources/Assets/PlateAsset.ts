import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PlateAsset extends BaseAsset {
  readonly id = "plate";

  readonly kind = "surface";

  readonly w = 26;

  readonly h = 4;

  readonly tags = ["prato", "dish"];

  draw(p: any, t: any) { const c = ShapeUtil.col(t, p.color, t.paper); return ShapeUtil.ell(0, -1.5, 13, 3, c) + ShapeUtil.ell(0, -2, 9, 1.8, ColorUtil.sh(c, -0.08)); }
}
