import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TumblerAsset extends BaseAsset {
  readonly id = "tumbler";

  readonly kind = "surface";

  readonly w = 5;

  readonly h = 11;

  readonly tags = ["copo com canudo", "copo térmico", "tumbler"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.paper);
    return `<path d="M-2.3 -8 L2.3 -8 L1.8 0 L-1.8 0 Z" fill="${c}"/><path d="M0.6 -8 L2.3 -8 L1.8 0 L0.6 0 Z" fill="${ColorUtil.sh(c, -0.1)}"/>` + ShapeUtil.rect(-2.6, -8.8, 5.2, 1, ColorUtil.sh(c, -0.05), 0.4)
      + `<path d="M0.5 -8.8 L1.2 -12" stroke="${ColorUtil.sh(c, -0.12)}" stroke-width="0.6"/>` + ShapeUtil.rect(-1.4, -5, 2.8, 1.2, t.ink, 0.2, "opacity=\"0.55\"");
  }
}
