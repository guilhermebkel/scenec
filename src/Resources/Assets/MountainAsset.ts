import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class MountainAsset extends BaseAsset {
  readonly id = "mountain";

  readonly kind = "ground";

  readonly w = 320;

  readonly h = 200;

  readonly tags = ["montanha", "hill", "serra"];

  draw(p: any, t: any) {
    return `<path d="M-160 0 L-40 -200 L40 -80 L80 -130 L160 0 Z" fill="${t.secondary}" opacity="0.6"/>` +
        `<path d="M-40 -200 L40 -80 L10 0 L-20 0 Z" fill="${ColorUtil.sh(t.secondary, -0.2)}" opacity="0.45"/><path d="M80 -130 L160 0 L110 0 Z" fill="${ColorUtil.sh(t.secondary, -0.2)}" opacity="0.45"/>` +
        `<path d="M-40 -200 L-62 -163 L-48 -170 L-36 -158 L-22 -170 Z" fill="${t.paper}" opacity="0.9"/>`;
  }
}
