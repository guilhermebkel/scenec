import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class StarAsset extends BaseAsset {
  readonly id = "star";

  readonly kind = "sky";

  readonly w = 14;

  readonly h = 14;

  readonly tags = ["estrela"];

  draw(p: any, t: any) { return `<path d="M0 -14 Q1 -8 7 -7 Q1 -6 0 0 Q-1 -6 -7 -7 Q-1 -8 0 -14 Z" fill="${t.paper}" opacity="0.9"/>`; }
}
