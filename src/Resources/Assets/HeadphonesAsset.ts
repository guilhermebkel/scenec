import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class HeadphonesAsset extends BaseAsset {
  readonly id = "headphones";

  readonly kind = "surface";

  readonly width = 10;

  readonly height = 9;

  readonly tags = ["fone", "headset", "fone de ouvido"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.ink);
    return `<path d="M-4.5 -2.5 Q-4.5 -9 0 -9 Q4.5 -9 4.5 -2.5" stroke="${mainColor}" stroke-width="1.3" fill="none"/>`
      + ShapeUtil.ellipse(-4.2, -2.3, 2.3, 2.6, mainColor) + ShapeUtil.ellipse(4.2, -2.3, 2.3, 2.6,
      ColorUtil.sh(mainColor, 0.15))
    + (params.mic !== false
      ? `<path d="M-5.5 -3 Q-9 -6 -7.5 -11" stroke="${mainColor}" stroke-width="0.7" fill="none"/>`
      + ShapeUtil.circle(-7.5, -11.2, 0.8, mainColor)
      : "");
  }
}
