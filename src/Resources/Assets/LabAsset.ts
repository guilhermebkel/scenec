import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LabAsset extends BaseAsset {
  readonly id = "lab";

  readonly kind = "ground";

  readonly width = 160;

  readonly height = 140;

  readonly tags = ["laboratório", "laboratorio", "centro de pesquisa", "research"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.secondary);
    let svg = ShapeUtil.shadow(theme, 86, 5) + ShapeUtil.rect(-80, -100, 160, 100, mainColor) + ShapeUtil.rect(30,
      -100, 50, 100, ColorUtil.sh(mainColor, -0.14)) + ShapeUtil.rect(-84, -106, 168, 8, ColorUtil.sh(mainColor, -0.3));
    for (let posY = -88; posY < -20; posY += 22) {
      for (let posX = -70; posX < 70; posX += 24) {
        svg += ShapeUtil.rect(posX,
          posY, 18, 14, theme.glass, { rx: 1 }) + ShapeUtil.rect(posX, posY + 10, 18, 4, ColorUtil.sh(theme.glass,
          -0.12));
      }
    }
    svg += ShapeUtil.rect(-16, -30, 32, 30, ColorUtil.sh(mainColor, -0.35), { rx: 2 }) + ShapeUtil.rect(-14, -28, 13,
      28, theme.glass, { rx: 1, extra: "opacity=\"0.8\"" }) + ShapeUtil.rect(1, -28, 13, 28, theme.glass, { rx: 1,
      extra: "opacity=\"0.8\"" });
    // dome do observatório + frasco no letreiro
    svg += `<path d="M30 -106 A26 26 0 0 1 82 -106 Z" fill="${theme.metal}"/><path d="M56 -132 A26 26 0 0 1 82 -106 L56 -106 Z" fill="${ColorUtil.sh(theme.metal, -0.15)}"/><path d="M52 -128 L70 -140" stroke="${theme.ink}" stroke-width="4" stroke-linecap="round"/>`;
    svg += ShapeUtil.rect(-60, -128, 54, 20, theme.paper, { rx: 4 })
      + `<path d="M-46 -125 L-46 -119 L-51 -111 L-37 -111 L-42 -119 L-42 -125 Z" fill="${theme.accent}"/>`
      + ShapeUtil.rect(-33, -121, 22, 3, theme.ink, { rx: 1 }) + ShapeUtil.rect(-33, -115, 16, 3, theme.ink, { rx: 1 });
    return svg;
  }
}
