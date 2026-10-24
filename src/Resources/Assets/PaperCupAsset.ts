import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PaperCupAsset extends BaseAsset {
  readonly id = "paper_cup";

  readonly kind = "surface";

  readonly w = 4.5;

  readonly h = 6;

  readonly tags = ["copo de café", "café para viagem", "coffee to go"];

  draw(p: any, t: any) { return `<path d="M-2 -5 L2 -5 L1.6 0 L-1.6 0 Z" fill="${t.paper}"/><path d="M0.6 -5 L2 -5 L1.6 0 L0.6 0 Z" fill="${ColorUtil.sh(t.paper, -0.1)}"/>` + ShapeUtil.rect(-2.3, -5.9, 4.6, 1, t.ink, 0.4) + ShapeUtil.rect(-1.9, -3.4, 3.7, 1.6, ShapeUtil.col(t, p.sleeve, t.woodDark), 0.2); }
}
