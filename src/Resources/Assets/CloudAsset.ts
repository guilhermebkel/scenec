import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class CloudAsset extends BaseAsset {
  readonly id = "cloud";

  readonly kind = "sky";

  readonly width = 110;

  readonly height = 50;

  readonly tags = ["nuvem"];

  draw(params: AssetParams, theme: Theme) {
    const puffs = ShapeUtil.blob(-28, -15, 15, { seed: 31, lobes: 4, fill: theme.paper })
      + ShapeUtil.blob(0, -26, 22, { seed: 32, lobes: 5, fill: theme.paper })
      + ShapeUtil.blob(28, -15, 15, { seed: 33, lobes: 4, fill: theme.paper })
      + ShapeUtil.rect(-43, -15, 86, 15, theme.paper, { rx: 7 });
    return `<g opacity="0.94">${puffs}</g>`
      + `<path d="M-43 -8 Q-43 0 -36 0 L36 0 Q43 0 43 -8 Z" fill="${ColorUtil.sh(theme.paper, -0.08)}" opacity="0.9"/>`;
  }
}
