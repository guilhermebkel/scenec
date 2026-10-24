import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BuildingAsset extends BaseAsset {
  readonly id = "building";

  readonly kind = "ground";

  readonly width = 90;

  readonly height = 300;

  readonly tags = ["prédio", "predio", "tower", "skyscraper"];

  size(params: AssetParams) { return ({ w: params.width || 90, h: params.floors ? params.floors * 30 + 26 : 306 }); }

  draw(params: AssetParams, theme: Theme) {
    const height = params.floors ? params.floors * 30 + 20 : 300, wide = params.width || 90, mainColor = ShapeUtil.col(theme, params.color, theme.secondary);
    let svg = ShapeUtil.rect(-wide / 2, -height, wide, height, mainColor) + ShapeUtil.rect(wide / 2 - wide * 0.28, -height, wide * 0.28, height, ColorUtil.sh(mainColor, -0.18)) + ShapeUtil.rect(-wide / 2 - 4, -height - 6, wide + 8, 8, ColorUtil.sh(mainColor, -0.35));
    let index = 0;
    for (let posY = -height + 20; posY < -25; posY += 30) {
      for (let posX = -wide / 2 + 12; posX < wide / 2 - 14; posX += 22) {
        const lit = ((index++ * 7 + Math.floor(wide) + (params.seed || 0)) % 5) < 2;
        svg += ShapeUtil.rect(posX, posY, 12, 16, lit ? theme.glass : ColorUtil.sh(mainColor, -0.35), 1) + (lit ? ShapeUtil.rect(posX, posY + 12, 12, 4, ColorUtil.sh(theme.glass, -0.12)) : "");
      }
    }
    return svg + ShapeUtil.rect(-10, -24, 20, 24, ColorUtil.sh(mainColor, -0.4), 2);
  }
}
