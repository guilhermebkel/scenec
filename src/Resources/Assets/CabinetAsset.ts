import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CabinetAsset extends BaseAsset {
  readonly id = "cabinet";

  readonly kind = "ground";

  readonly width = 40;

  readonly height = 36;

  readonly tags = ["armário", "armario", "gabinete", "cabinet"];

  size(params: AssetParams) { return ({ w: params.width || 40, h: params.height || 36 }); }

  draw(params: AssetParams, theme: Theme) {
    const wide = params.width || 40, tall = params.height || 36, count = params.doors || 2, mainColor = ShapeUtil.col(theme, params.color, theme.wood), plinth = 2;
    let svg = ShapeUtil.shadow(theme, wide * 0.52, 1.8) + ShapeUtil.rect(-wide / 2, -tall, wide, tall, ColorUtil.sh(mainColor, -0.1)) + ShapeUtil.rect(-wide / 2 + 1, -plinth, wide - 2, plinth, ColorUtil.sh(mainColor, -0.3));
    const dw = (wide - 1) / count;
    for (let index = 0; index < count; index++) {
      const posX = -wide / 2 + 0.5 + index * dw;
      svg += ShapeUtil.rect(posX + 0.3, -tall + 0.5, dw - 0.6, tall - plinth - 0.8, mainColor, 0.4) + ShapeUtil.rect(posX + dw - 1.2, -tall + 0.5, 0.9, tall - plinth - 0.8, ColorUtil.sh(mainColor, -0.12));
      const hx = index < count / 2 ? posX + dw - 2.6 : posX + 1.8;
      if (count > 1 || params.handle !== false) { svg += ShapeUtil.rect(hx, -tall * 0.72, 0.8, tall * 0.3, theme.metal, 0.4); }
    }
    return svg;
  }
}
