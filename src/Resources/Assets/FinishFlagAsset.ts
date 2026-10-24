import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FinishFlagAsset extends BaseAsset {
  readonly id = "finish_flag";

  readonly kind = "ground";

  readonly w = 50;

  readonly h = 90;

  readonly tags = ["bandeira de chegada", "chegada", "finish", "bandeira quadriculada"];

  draw(p: any, t: any) {
    let s = ShapeUtil.shadow(t, 10, 2) + `<path d="M0 0 L0 -90" stroke="${t.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) s += ShapeUtil.rect(2 + i * 10, -88 + j * 10 + (i % 2 ? 1 : 0), 10, 10, (i + j) % 2 ? t.ink : t.paper);
    return s + ShapeUtil.rect(2, -88, 40, 30, "none", 0, `stroke="${t.ink}" stroke-width="1.2"`);
  }
}
