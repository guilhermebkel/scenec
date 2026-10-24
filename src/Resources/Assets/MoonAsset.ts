import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class MoonAsset extends BaseAsset {
  readonly id = "moon";

  readonly kind = "sky";

  readonly w = 60;

  readonly h = 60;

  readonly tags = ["lua"];

  draw(p: any, t: any) {
    return ShapeUtil.circle(4, -32, 34, t.primary, "opacity=\"0.12\"") + `<path d="M10 -58 A28 28 0 1 0 22 -10 A22 22 0 1 1 10 -58 Z" fill="${t.primary}"/>` +
        ShapeUtil.circle(-6, -28, 3, t.ink, "opacity=\"0.12\"") + ShapeUtil.circle(4, -16, 2, t.ink, "opacity=\"0.12\"");
  }
}
