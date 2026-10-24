import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ChairAsset extends BaseAsset {
  readonly id = "chair";

  readonly kind = "ground";

  readonly width = 44;

  readonly height = 88;

  readonly seat = 45;

  readonly tags = ["cadeira", "seat"];

  draw(params: AssetParams, theme: Theme) {
    const flip = ShapeUtil.directionOf(params.facing), mainColor = ShapeUtil.color(theme, params.color, theme.secondary);
    return ShapeUtil.shadow(theme, 24, 3) + ShapeUtil.rect(-16, -40, 4, 40, theme.metal) + ShapeUtil.rect(12, -40, 4,
      40, ColorUtil.sh(theme.metal, -0.2))
    + ShapeUtil.rect(-flip * 18 - (flip > 0 ? 0 : 6), -88, 6, 49, mainColor, { rx: 3 }) + ShapeUtil.rect(-18, -45,
      36, 6, mainColor, { rx: 2 }) + ShapeUtil.rect(-18, -41, 36, 2, ColorUtil.sh(mainColor, -0.25));
  }
}
