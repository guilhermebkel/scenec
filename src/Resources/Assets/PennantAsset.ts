import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PennantAsset extends BaseAsset {
  readonly id = "pennant";

  readonly kind = "ground";

  readonly w = 30;

  readonly h = 70;

  readonly tags = ["bandeirinha", "flag"];

  draw(p: any, t: any) { return ShapeUtil.shadow(t, 7, 1.6) + `<path d="M0 0 L0 -70" stroke="${t.metal}" stroke-width="2.5"/><path d="M1 -70 L28 -62 L1 -54 Z" fill="${ShapeUtil.col(t, p.color, t.accent)}"/>`; }
}
