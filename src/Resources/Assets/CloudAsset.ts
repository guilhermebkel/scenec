import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class CloudAsset extends BaseAsset {
  readonly id = "cloud";

  readonly kind = "sky";

  readonly w = 110;

  readonly h = 50;

  readonly tags = ["nuvem"];

  draw(p: any, t: any) {
    return `<g fill="${t.paper}" opacity="0.94"><circle cx="-28" cy="-15" r="15"/><circle cx="0" cy="-26" r="22"/><circle cx="28" cy="-15" r="15"/><rect x="-43" y="-15" width="86" height="15" rx="7"/></g>` +
        `<path d="M-43 -8 Q-43 0 -36 0 L36 0 Q43 0 43 -8 Z" fill="${ColorUtil.sh(t.paper, -0.08)}" opacity="0.9"/>`;
  }
}
