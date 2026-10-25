import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LightSwitchAsset extends BaseAsset {
  readonly id = "light_switch";

  readonly kind = "wall";

  readonly width = 5;

  readonly height = 7;

  readonly elevation = 110;

  readonly tags = ["interruptor", "tomada", "switch"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-2.4, -7, 5, 7, "rgba(0,0,0,0.08)", { rx: 0.6 })
      + ShapeUtil.rect(-2.5, -7.2, 5, 7, theme.paper, { rx: 0.6 }) + ShapeUtil.rect(-1, -5.2, 2, 3,
      ColorUtil.sh(theme.paper, -0.08), { rx: 0.4 });
  }
}
