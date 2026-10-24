import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TumblerAsset extends BaseAsset {
  readonly id = "tumbler";

  readonly kind = "surface";

  readonly width = 5;

  readonly height = 11;

  readonly tags = ["copo com canudo", "copo térmico", "tumbler"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.paper);
    return `<path d="M-2.3 -8 L2.3 -8 L1.8 0 L-1.8 0 Z" fill="${mainColor}"/><path d="M0.6 -8 L2.3 -8 L1.8 0 L0.6 0 Z" fill="${ColorUtil.sh(mainColor, -0.1)}"/>`
      + ShapeUtil.rect(-2.6, -8.8, 5.2, 1, ColorUtil.sh(mainColor, -0.05), { rx: 0.4 })
      + `<path d="M0.5 -8.8 L1.2 -12" stroke="${ColorUtil.sh(mainColor, -0.12)}" stroke-width="0.6"/>`
      + ShapeUtil.rect(-1.4, -5, 2.8, 1.2, theme.ink, { rx: 0.2, extra: "opacity=\"0.55\"" });
  }
}
