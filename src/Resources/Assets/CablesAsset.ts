import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CablesAsset extends BaseAsset {
  readonly id = "cables";

  readonly kind = "surface";

  readonly w = 14;

  readonly h = 4;

  readonly tags = ["cabos", "fios", "carregador"];

  draw(p: any, t: any) {
    const drop = p.drop ?? 30, c = ShapeUtil.col(t, p.color, t.ink);
    return `<path d="M-7 -1 Q-3 -5 0 -1.5 Q3 1 6 -3 M-5 -0.5 Q-1 -3 3 -0.3" stroke="${c}" stroke-width="0.55" fill="none"/>` + ShapeUtil.rect(-2, -1.6, 3.5, 1.4, c, 0.3) +
          `<path d="M-4 0 Q-6 ${drop * 0.5} -3 ${drop} M5 0 Q8 ${drop * 0.4} 4 ${drop * 0.75}" stroke="${c}" stroke-width="0.45" fill="none"/>`;
  }
}
