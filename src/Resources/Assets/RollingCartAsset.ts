import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class RollingCartAsset extends BaseAsset {
  readonly id = "rolling_cart";

  readonly kind = "ground";

  readonly width = 26;

  readonly height = 36;

  readonly top = 36;

  readonly tags = ["gaveteiro com rodinhas", "carrinho", "rolling cabinet"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.wood), darker = ColorUtil.sh(mainColor, -0.35);
    let svg = ShapeUtil.shadow(theme, 14, 1.5) + ShapeUtil.rect(-13, -36, 26, 33, ColorUtil.sh(mainColor, -0.08))
      + ShapeUtil.rect(-11.5, -34.5, 23, 9, darker) + ShapeUtil.rect(-11.5, -24, 23, 9, darker) + ShapeUtil.rect(-13,
      -25.5, 26, 1.5, mainColor)
    + ShapeUtil.rect(-9, -30, 10, 4.5, theme.paper, { rx: 0.5 }) + ShapeUtil.rect(-8, -31, 6, 1.5, theme.primary)
    + ShapeUtil.rect(3, -29, 5, 3.5, theme.paper)
    + ShapeUtil.rect(-9, -21.5, 17, 6, theme.ink, { rx: 1 }) + ShapeUtil.rect(-9, -21.5, 17, 1,
      ColorUtil.sh(theme.ink, 0.2));
    [-14.5, -8.5].forEach((posY) => {
      svg += ShapeUtil.rect(-12, posY, 24, 5.6, mainColor, { rx: 0.5 })
        + ShapeUtil.rect(-7, posY + 2.6, 14, 0.8, theme.metal, { rx: 0.4 });
    });
    return svg + [-10, 10].map((posX) => ShapeUtil.circle(posX, -1.5, 1.6, theme.ink)).join("");
  }
}
