import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PineAsset extends BaseAsset {
  readonly id = "pine";

  readonly kind = "ground";

  readonly width = 80;

  readonly height = 200;

  readonly tags = ["pinheiro", "pine_tree", "conifer"];

  draw(params: AssetParams, theme: Theme) {
    let [first, , mainColor] = theme.foliage; if (params.color) {
      first = ShapeUtil.color(theme, params.color,
        first); mainColor = ColorUtil.sh(first, -0.12);
    }
    const tri = (y0: any, y1: any, hw: any,
      colr: any) => `<path d="M${-hw} ${y0} L0 ${y1} L${hw} ${y0} Z" fill="${colr}"/><path d="M0 ${y1} L${hw} ${y0} L0 ${y0} Z" fill="${ColorUtil.sh(colr, -0.15)}"/>`;
    return ShapeUtil.shadow(theme, 32, 3.5) + ShapeUtil.rect(-6, -30, 12, 30, theme.trunk) + ShapeUtil.rect(0, -30,
      6, 30, ColorUtil.sh(theme.trunk, -0.2))
    + tri(-30, -95, 40, mainColor) + tri(-80, -145, 33, first) + tri(-128, -195, 25, mainColor);
  }
}
