import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PizzaAsset extends BaseAsset {
  readonly id = "pizza";

  readonly kind = "surface";

  readonly width = 40;

  readonly height = 8;

  readonly tags = ["pizza"];

  draw(params: AssetParams, theme: Theme) {
    const toppings: [number, number][] = [[-8, -3.6], [2, -4.2], [9, -3], [-2, -2.6], [5, -2.2]];
    return ShapeUtil.ellipse(0, -2, 20, 4.5, theme.paper) + ShapeUtil.ellipse(0, -3, 17, 3.5, "#E9B44C")
      + ShapeUtil.ellipse(0, -3.4, 15, 2.8, theme.primary)
      + toppings.map(([posX, posY], index) => (
        ShapeUtil.ellipse(posX, posY, 2, 0.9, index % 2 ? "#F6E6B4" : ColorUtil.sh(theme.primary, -0.35))
      )).join("") + ShapeUtil.ellipse(-5, -4.6, 2.5, 0.7, "#5E8C3A");
  }
}
