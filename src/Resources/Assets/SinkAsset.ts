import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SinkAsset extends BaseAsset {
  readonly id = "sink";

  readonly kind = "ground";

  readonly width = 70;

  readonly height = 90;

  readonly top = 90;

  readonly tags = ["pia", "sink", "faucet", "torneira", "kitchen_sink"];

  draw(params: AssetParams, theme: Theme) {
    const baseColor = ShapeUtil.color(theme, params.color, theme.woodDark);
    const counterColor = ColorUtil.sh(theme.metal, 0.1);
    const basinColor = ColorUtil.sh(theme.metal, -0.2);
    const faucetColor = ColorUtil.sh(theme.metal, 0.25);
    return ShapeUtil.shadow(theme, 35, 4)
      + ShapeUtil.rect(-35, -84, 70, 84, baseColor, { rx: 3 })
      + ShapeUtil.rect(-33, -80, 31, 76, ColorUtil.sh(baseColor, -0.1), { rx: 2 })
      + ShapeUtil.rect(2, -80, 31, 76, ColorUtil.sh(baseColor, -0.1), { rx: 2 })
      + ShapeUtil.rect(-5, -45, 2, 12, theme.metal, { rx: 1 })
      + ShapeUtil.rect(3, -45, 2, 12, theme.metal, { rx: 1 })
      + ShapeUtil.rect(-36, -90, 72, 6, counterColor, { rx: 2 })
      + ShapeUtil.rect(-18, -89, 36, 4, basinColor, { rx: 1 })
      + `<path d="M0 -90 L0 -106 Q0 -114 8 -114 Q16 -114 16 -106 L16 -102" stroke="${faucetColor}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      + ShapeUtil.rect(-3, -93, 6, 3, faucetColor, { rx: 1 });
  }
}
