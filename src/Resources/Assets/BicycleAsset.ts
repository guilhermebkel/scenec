import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BicycleAsset extends BaseAsset {
  readonly id = "bicycle";

  readonly kind = "ground";

  readonly width = 80;

  readonly height = 48;

  readonly tags = ["bicicleta", "bike"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.secondary);
    const flip = ShapeUtil.directionOf(params.facing);
    const wh = (posX: number): string => `<circle cx="${posX}" cy="-17" r="16" fill="none" stroke="${theme.ink}" stroke-width="3.5"/>`
      + ShapeUtil.circle(posX, -17, 2.5, theme.metal);
    return `<g transform="scale(${flip} 1)">` + ShapeUtil.shadow(theme, 40, 3) + wh(-24) + wh(24)
      + `<path d="M-24 -17 L-6 -17 L10 -38 L-12 -38 Z M-6 -17 L-14 -42 M24 -17 L14 -46" stroke="${mainColor}" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`
      + `<path d="M-20 -43 L-8 -43" stroke="${theme.ink}" stroke-width="4" stroke-linecap="round"/><path d="M10 -47 L19 -48" stroke="${theme.ink}" stroke-width="3" stroke-linecap="round"/>`
      + ShapeUtil.circle(-6, -17, 4, theme.metal) + `</g>`;
  }
}
