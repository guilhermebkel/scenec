import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LaptopOpenAsset extends BaseAsset {
  readonly id = "laptop_open";

  readonly kind = "surface";

  readonly width = 17;

  readonly height = 18;

  readonly tags = ["notebook aberto", "laptop de frente", "laptop stand"];

  draw(params: AssetParams, theme: Theme) {
    const lift = params.stand === false ? 0 : 5;
    let svg = "";
    if (lift) {
      svg += `<path d="M-6 0 L4 -${lift} M6 0 L-4 -${lift}" stroke="${theme.metal}" stroke-width="1" />`
        + ShapeUtil.rect(-7, -0.8, 14, 0.8, theme.metal);
    }
    svg += `<path d="M-8.5 ${-lift} L8.5 ${-lift} L7 ${-lift - 2.2} L-7 ${-lift - 2.2} Z" fill="${ColorUtil.sh(theme.ink, 0.25)}"/>`
      + ShapeUtil.rect(-7.2, -lift - 13, 14.4, 11, theme.ink, { rx: 0.8 }) + ShapeUtil.rect(-6.4, -lift - 12.2, 12.8,
      9, params.on ? theme.glass : ColorUtil.sh(theme.ink, 0.12), { rx: 0.4 })
    + `<path d="M-6.4 ${-lift - 12.2} L-1 ${-lift - 12.2} L-6.4 ${-lift - 6} Z" fill="#FFFFFF" opacity="0.08"/>`;
    return svg;
  }
}
