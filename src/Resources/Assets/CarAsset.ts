import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CarAsset extends BaseAsset {
  readonly id = "car";

  readonly kind = "ground";

  readonly width = 140;

  readonly height = 62;

  readonly tags = ["carro", "automóvel", "automovel", "auto"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.primary);
    const flip = ShapeUtil.directionOf(params.facing);
    const wheel = (posX: number): string => ShapeUtil.circle(posX, -13, 13, theme.ink)
      + ShapeUtil.circle(posX, -13, 6, theme.metal) + ShapeUtil.circle(posX, -13, 2.5, ColorUtil.sh(theme.metal, -0.3));
    return `<g transform="scale(${flip} 1)">` + ShapeUtil.shadow(theme, 70, 4.5)
      + `<path d="M-68 -16 L-68 -34 Q-66 -40 -56 -42 L-36 -44 L-18 -60 Q-12 -64 0 -64 L28 -64 Q38 -64 44 -56 L56 -44 Q68 -42 70 -34 L70 -16 Z" fill="${mainColor}"/>`
      + `<path d="M-68 -26 L70 -26 L70 -16 L-68 -16 Z" fill="${ColorUtil.sh(mainColor, -0.15)}"/>`
      + `<path d="M-30 -44 L-15 -57 Q-11 -60 -4 -60 L6 -60 L6 -44 Z" fill="${theme.glass}"/><path d="M11 -60 L27 -60 Q34 -60 38 -55 L49 -44 L11 -44 Z" fill="${theme.glass}"/>`
      + `<path d="M-24 -46 L-14 -56" stroke="${theme.paper}" stroke-width="2.5" opacity="0.6"/>`
      + ShapeUtil.rect(64, -36, 6, 6, theme.accent, { rx: 2 }) + ShapeUtil.rect(-68, -36, 5, 6,
      ColorUtil.sh(theme.primary, -0.3), { rx: 2 }) + ShapeUtil.rect(-6, -36, 10, 2.5, ColorUtil.sh(mainColor,
      -0.35), { rx: 1 }) + ShapeUtil.rect(26, -36, 10, 2.5, ColorUtil.sh(mainColor, -0.35), { rx: 1 })
    + wheel(-40) + wheel(42) + `</g>`;
  }
}
