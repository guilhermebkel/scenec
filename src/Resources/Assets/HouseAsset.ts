import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { DetailUtil } from "@/Utils/DetailUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class HouseAsset extends BaseAsset {
  readonly id = "house";

  readonly kind = "ground";

  readonly width = 160;

  readonly height = 175;

  readonly tags = ["casa", "home"];

  draw(params: AssetParams, theme: Theme) {
    const body = ShapeUtil.color(theme, params.color, theme.primary);
    const roof = theme.secondary;
    const rank = DetailUtil.rankOf(params.detail);
    const hasParts = rank >= 1;
    const isHigh = rank >= 2;
    const windows: [number, number][] = [[-52, -80], [26, -80]];
    const shingles = isHigh
      ? `<path d="${[-105, -115, -125, -135, -145, -155].map((row) => {
        const half = ((170 + row) * 80) / 75 - 4;
        return `M${-half} ${row} L${half} ${row}`;
      }).join(" ")}" stroke="${ColorUtil.sh(roof, -0.22)}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`
      : "";
    const siding = isHigh
      ? `<path d="M-63 -88 L63 -88 M-63 -76 L-54 -76 M-24 -76 L24 -76 M-63 -52 L-17 -52 M17 -52 L63 -52 M-63 -40 L-17 -40 `
      + `M17 -40 L63 -40 M-63 -28 L-17 -28 M17 -28 L63 -28 M-63 -16 L-17 -16 M17 -16 L63 -16" `
      + `stroke="${ColorUtil.sh(body, -0.12)}" stroke-width="0.6" fill="none"/>`
      : "";
    const door = isHigh
      ? `<path d="M-10 -48 L-2 -48 L-2 -30 L-10 -30 Z M-10 -26 L-2 -26 L-2 -8 L-10 -8 Z" `
      + `stroke="${ColorUtil.sh(theme.woodDark, -0.25)}" stroke-width="0.8" fill="none"/>`
      : "";
    const glass = (posX: number, posY: number): string => {
      const sheen = hasParts
        ? `<path d="M${posX + 4} ${posY + 18} L${posX + 14} ${posY + 4}" stroke="${theme.paper}" stroke-width="2.5" opacity="0.6"/>`
        : "";
      const mullion = isHigh
        ? `<path d="M${posX + 13} ${posY} L${posX + 13} ${posY + 24} M${posX} ${posY + 12} L${posX + 26} ${posY + 12}" `
        + `stroke="${theme.paper}" stroke-width="1.5"/>`
        : "";
      const sill = hasParts ? ShapeUtil.rect(posX - 3, posY + 24, 32, 3, theme.paper, { rx: 1 }) : "";
      return ShapeUtil.rect(posX, posY, 26, 24, theme.glass, { rx: 2,
        extra: `stroke="${theme.paper}" stroke-width="3"` }) + sheen + mullion + sill;
    };
    return ShapeUtil.shadow(theme, 88, 5)
      + (hasParts
        ? ShapeUtil.rect(40, -150, 16, 32, theme.woodDark) + ShapeUtil.rect(48, -150, 8, 32,
          ColorUtil.sh(theme.woodDark, -0.2)) + ShapeUtil.rect(38, -154, 20, 6, ColorUtil.sh(theme.woodDark, -0.1),
          { rx: 1 })
        : ShapeUtil.rect(40, -150, 16, 32, theme.woodDark))
      + ShapeUtil.rect(-65, -100, 130, 100, body) + ShapeUtil.rect(25, -100, 40, 100, ColorUtil.sh(body, -0.12))
      + siding
      + `<path d="M-65 -100 L65 -100 L65 -92 L-65 -92 Z" fill="${ColorUtil.sh(body, -0.28)}" opacity="0.6"/>`
      + `<path d="M-80 -95 L0 -170 L80 -95 Z" fill="${roof}"/><path d="M0 -170 L80 -95 L40 -95 Z" fill="${ColorUtil.sh(roof, -0.18)}"/>`
      + shingles
      + (hasParts
        ? `<path d="M-84 -92 L0 -172 L84 -92" stroke="${ColorUtil.sh(roof, -0.3)}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`
        : "")
      + ShapeUtil.rect(-15, -56, 30, 56, theme.woodDark, { rx: 3 }) + ShapeUtil.rect(2, -56, 13, 56,
      ColorUtil.sh(theme.woodDark, -0.15), { rx: 0 }) + (hasParts ? ShapeUtil.circle(9, -28, 2, theme.accent) : "") + door
      + (hasParts ? ShapeUtil.rect(-19, -2, 38, 3, ColorUtil.sh(body, -0.35)) : "")
      + windows.map(([posX, posY]) => glass(posX, posY)).join("")
      + ShapeUtil.circle(0, -122, 9, theme.glass, `stroke="${theme.paper}" stroke-width="3"`);
  }
}
