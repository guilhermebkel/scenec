import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FirstAidKitAsset extends BaseAsset {
  readonly id = "first_aid_kit";

  readonly kind = "surface";

  readonly width = 38;

  readonly height = 30;

  readonly tags = ["primeiros_socorros", "maleta_medica", "first_aid_kit", "medical_kit", "medicine_box"];

  draw(params: AssetParams, theme: Theme) {
    const boxColor = ShapeUtil.color(theme, params.color, theme.paper);
    const red = "#E54D42";
    const shade = ColorUtil.sh(boxColor, -0.12);
    return ShapeUtil.rect(-19, -26, 38, 26, boxColor, { rx: 4 })
      + ShapeUtil.rect(6, -26, 13, 26, shade, { rx: 4 })
      + ShapeUtil.rect(-8, -30, 16, 4, theme.metal, { rx: 2 })
      + ShapeUtil.rect(-19, -15, 38, 2, ColorUtil.sh(boxColor, -0.2))
      + ShapeUtil.rect(-2, -19, 4, 10, red, { rx: 1 })
      + ShapeUtil.rect(-5, -16, 10, 4, red, { rx: 1 });
  }
}
