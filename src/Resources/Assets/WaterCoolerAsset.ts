import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class WaterCoolerAsset extends BaseAsset {
  readonly id = "water_cooler";

  readonly kind = "ground";

  readonly width = 36;

  readonly height = 115;

  readonly top = 85;

  readonly tags = ["bebedouro", "water_cooler", "water_dispenser", "water_bottle"];

  draw(params: AssetParams, theme: Theme) {
    const bodyColor = ShapeUtil.color(theme, params.color, theme.paper);
    const bottleColor = "rgba(70, 160, 240, 0.75)";
    const darkBody = ColorUtil.sh(theme.metal, -0.15);
    return ShapeUtil.shadow(theme, 18, 3.5)
      + ShapeUtil.rect(-16, -85, 32, 85, bodyColor, { rx: 4 })
      + ShapeUtil.rect(4, -85, 12, 85, ColorUtil.sh(bodyColor, -0.08), { rx: 4 })
      + ShapeUtil.rect(-12, -75, 24, 25, darkBody, { rx: 3 })
      + ShapeUtil.rect(-6, -72, 3, 6, "#E54D42", { rx: 1 })
      + ShapeUtil.rect(3, -72, 3, 6, "#3B82F6", { rx: 1 })
      + ShapeUtil.rect(-10, -53, 20, 2, theme.metal)
      + ShapeUtil.rect(-7, -90, 14, 6, darkBody, { rx: 2 })
      + ShapeUtil.rect(-13, -115, 26, 25, bottleColor, { rx: 8 })
      + ShapeUtil.rect(2, -115, 11, 25, "rgba(50, 130, 210, 0.6)", { rx: 8 });
  }
}
