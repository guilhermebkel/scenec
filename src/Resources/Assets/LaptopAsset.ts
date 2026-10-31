import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { DetailUtil } from "@/Utils/DetailUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LaptopAsset extends BaseAsset {
  readonly id = "laptop";

  readonly kind = "surface";

  readonly width = 34;

  readonly height = 24;

  readonly tags = ["notebook", "computador", "computer"];

  draw(params: AssetParams, theme: Theme) {
    const flip = ShapeUtil.directionOf(params.facing);
    const rank = DetailUtil.rankOf(params.detail);
    const sheen = rank >= 1
      ? `<path d="M${-flip * 13} -5 L${-flip * 16.5} -23" stroke="${theme.glass}" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>`
      : "";
    const keys = rank >= 2
      ? `<path d="M-13 -1.9 L13 -1.9" stroke="${ColorUtil.sh(theme.metal, 0.35)}" stroke-width="0.7" stroke-dasharray="1.2 0.8" fill="none"/>`
      + `<path d="M${-flip * 11} -9 L${-flip * 13} -16" stroke="${theme.paper}" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>`
      : "";
    return ShapeUtil.rect(-17, -3, 34, 3, theme.metal, { rx: 1.5 }) + ShapeUtil.rect(-17, -1.5, 34, 1.5,
      ColorUtil.sh(theme.metal, -0.25))
    + `<path d="M${-flip * 15} -3 L${-flip * 19} -25" stroke="${theme.ink}" stroke-width="3.5" stroke-linecap="round"/>`
    + sheen + keys;
  }
}
