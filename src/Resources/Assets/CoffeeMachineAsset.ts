import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CoffeeMachineAsset extends BaseAsset {
  readonly id = "coffee_machine";

  readonly kind = "surface";

  readonly width = 34;

  readonly height = 40;

  readonly tags = ["máquina de café", "espresso"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-17, -40, 34, 40, theme.metal, { rx: 4 })
      + ShapeUtil.rect(6, -40, 11, 40, ColorUtil.sh(theme.metal, -0.18), { rx: 4 }) + ShapeUtil.rect(-12, -34, 24, 9,
      theme.ink, { rx: 2 }) + ShapeUtil.circle(-6, -30, 1.8, theme.accent) + ShapeUtil.rect(-6, -20, 12, 4, theme.ink)
    + ShapeUtil.rect(-5, -10, 10, 10, theme.paper, { rx: 1 });
  }
}
