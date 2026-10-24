import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CounterAsset extends BaseAsset {
  readonly id = "counter";

  readonly kind = "ground";

  readonly width = 220;

  readonly height = 62;

  readonly top = 62;

  readonly tags = ["balcão", "balcao", "bar", "kitchen_counter"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.shadow(theme, 112, 4) + ShapeUtil.rect(-104, -54, 208, 54, theme.wood) + ShapeUtil.rect(-104, -54, 208, 6, ColorUtil.sh(theme.wood, -0.22))
      + [-70, 0, 70].map((posX) => ShapeUtil.rect(posX - 28, -44, 56, 38, ColorUtil.sh(theme.wood, -0.12), 3) + ShapeUtil.rect(posX - 8, -40, 16, 2.5, theme.metal, 1)).join("")
      + ShapeUtil.rect(-110, -62, 220, 8, theme.woodDark, 2) + ShapeUtil.rect(-108, -62, 216, 1.5, ColorUtil.sh(theme.woodDark, 0.25));
  }
}
