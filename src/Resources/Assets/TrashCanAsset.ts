import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TrashCanAsset extends BaseAsset {
  readonly id = "trash_can";

  readonly kind = "ground";

  readonly width = 9;

  readonly height = 15;

  readonly tags = ["lixeira", "cesto de lixo", "bin"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, "#C9CCD0");
    return ShapeUtil.shadow(theme, 5.5, 1) + ShapeUtil.rect(-4.5, -13.5, 9, 13, mainColor, { rx: 1.2 })
      + ShapeUtil.rect(-4.5, -13.5, 2.2, 13, ColorUtil.sh(mainColor, 0.35), { rx: 1 }) + ShapeUtil.rect(1.8, -13.5,
      2.7, 13, ColorUtil.sh(mainColor, -0.22), { rx: 1 })
    + ShapeUtil.ellipse(0, -13.6, 4.6, 1.2, ColorUtil.sh(mainColor, -0.1)) + ShapeUtil.rect(-4.7, -15, 9.4, 1.8,
      ColorUtil.sh(mainColor, -0.05), { rx: 0.8 }) + ShapeUtil.rect(-1.5, -1.5, 3, 1.5, theme.ink, { rx: 0.5 });
  }
}
