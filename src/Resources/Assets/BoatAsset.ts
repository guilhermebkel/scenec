import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class BoatAsset extends BaseAsset {
  readonly id = "boat";

  readonly kind = "water";

  readonly width = 70;

  readonly height = 70;

  readonly tags = ["barco", "veleiro", "sailboat"];

  draw(params: AssetParams, theme: Theme) {
    return `<path d="M-35 -14 L35 -14 L25 0 L-25 0 Z" fill="${theme.primary}"/><path d="M-35 -14 L35 -14 L33 -10 L-33 -10 Z" fill="${ColorUtil.sh(theme.primary, 0.2)}"/>`
      + `<path d="M0 -14 L0 -70" stroke="${theme.ink}" stroke-width="2.5"/><path d="M3 -68 L30 -18 L3 -18 Z" fill="${theme.paper}"/><path d="M3 -68 L16 -43 L3 -43 Z" fill="${ColorUtil.sh(theme.paper, -0.08)}"/><path d="M-3 -60 L-24 -18 L-3 -18 Z" fill="${ColorUtil.sh(theme.paper, -0.12)}"/>`
      + `<path d="M-40 1 Q-30 -2 -20 1 T0 1 T20 1 T40 1" stroke="${theme.paper}" stroke-width="2" fill="none" opacity="0.6"/>`;
  }
}
