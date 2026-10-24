import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DiplomaAsset extends BaseAsset {
  readonly id = "diploma";

  readonly kind = "any";

  readonly w = 26;

  readonly h = 12;

  readonly tags = ["diploma", "canudo", "certificado"];

  draw(p: any, t: any) { return ShapeUtil.rect(-13, -10, 26, 10, t.paper, 5) + ShapeUtil.rect(-13, -10, 26, 4, ColorUtil.sh(t.paper, 0.0), 5) + ShapeUtil.rect(-13, -4, 26, 4, ColorUtil.sh(t.paper, -0.12), 2) + ShapeUtil.rect(-2, -11, 4, 12, t.primary) + `<path d="M0 0 L-3 6 M0 0 L3 6" stroke="${t.primary}" stroke-width="1.6"/>`; }
}
