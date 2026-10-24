import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class BirdAsset extends BaseAsset {
  readonly id = "bird";

  readonly kind = "sky";

  readonly w = 20;

  readonly h = 10;

  readonly tags = ["pássaro", "passaro", "gaivota", "birds"];

  draw(p: any, t: any) { return `<path d="M-10 -6 Q-5 -11 0 -5 Q5 -11 10 -6" stroke="${t.ink}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.75"/>`; }
}
