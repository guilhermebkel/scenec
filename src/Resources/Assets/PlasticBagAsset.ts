import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PlasticBagAsset extends BaseAsset {
  readonly id = "plastic_bag";

  readonly kind = "surface";

  readonly width = 11;

  readonly height = 9;

  readonly tags = ["sacola", "sacola plástica", "bag"];

  draw(params: AssetParams, theme: Theme) {
    return `<path d="M-5.5 0 Q-6 -5 -3.5 -7.5 Q-2 -9.5 0 -8 Q2.5 -9.8 4 -7.2 Q6.3 -4.5 5.5 0 Z" fill="${ShapeUtil.color(theme, params.color, "#F2F2F0")}"/>`
      + `<path d="M-3 -6 Q-1 -3 -2 -1 M1.5 -7 Q3 -4 2 -0.5 M-0.5 -4 L0.5 -2" stroke="#C9C9C6" stroke-width="0.4" fill="none"/>`
      + ShapeUtil.rect(-2, -3.5, 3, 2, "#9A9A98", { rx: 0.3, extra: "opacity=\"0.35\"" });
  }
}
