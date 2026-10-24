import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BigPlantAsset extends BaseAsset {
  readonly id = "big_plant";

  readonly kind = "ground";

  readonly width = 60;

  readonly height = 110;

  readonly tags = ["planta grande", "costela de adão", "monstera"];

  draw(params: AssetParams, theme: Theme) {
    const [first, second, color] = theme.foliage; const pot = ShapeUtil.col(theme, params.pot, "#C9724E");
    const lf = (posX: any, posY: any, rot: any, colr: any) => `<ellipse cx="${posX}" cy="${posY}" rx="11" ry="22" fill="${colr}" transform="rotate(${rot} ${posX} ${posY})"/><path d="M${posX} ${posY + 20} L${posX} ${posY - 18}" stroke="${ColorUtil.sh(colr, -0.2)}" stroke-width="1.4" transform="rotate(${rot} ${posX} ${posY})"/>`;
    return ShapeUtil.shadow(theme, 22, 3) + lf(-16, -64, -35, color) + lf(16, -66, 35, second) + lf(0, -86, 0, first) + lf(-24, -88, -50, first) + lf(24, -90, 48, color) + lf(-6, -58, -12, second)
      + `<path d="M-16 -34 L16 -34 L12 0 L-12 0 Z" fill="${pot}"/><path d="M4 -34 L16 -34 L12 0 L4 0 Z" fill="${ColorUtil.sh(pot, -0.12)}"/>` + ShapeUtil.rect(-17, -36, 34, 5, ColorUtil.sh(pot, -0.2), 2);
  }
}
