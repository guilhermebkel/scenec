import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { DetailUtil } from "@/Utils/DetailUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DeskAsset extends BaseAsset {
  readonly id = "desk";

  readonly kind = "ground";

  readonly width = 130;

  readonly height = 46;

  readonly top = 46;

  readonly tags = ["mesa de trabalho", "escrivaninha", "table_desk"];

  draw(params: AssetParams, theme: Theme) {
    const rank = DetailUtil.rankOf(params.detail);
    const hasParts = rank >= 1;
    const hasTexture = rank >= 2;
    const grain = hasTexture
      ? `<path d="M-50 -43.6 L-34 -43.6 M-20 -42.4 L-2 -42.4 M14 -43.6 L36 -43.6 M42 -42.4 L58 -42.4" `
      + `stroke="${ColorUtil.sh(theme.wood, -0.14)}" stroke-width="0.6" stroke-linecap="round" fill="none"/>`
      + `<path d="M21.5 -35 L46.5 -35 L46.5 -22 L21.5 -22 Z" stroke="${ColorUtil.sh(theme.woodDark, -0.22)}" `
      + `stroke-width="0.8" fill="none"/>`
      + ShapeUtil.rect(-57.5, -38, 1.5, 36, ColorUtil.sh(theme.woodDark, 0.15))
      + ShapeUtil.rect(52.5, -38, 1.5, 36, ColorUtil.sh(theme.woodDark, 0.15))
      : "";
    return ShapeUtil.shadow(theme, 68, 3.5) + ShapeUtil.rect(-58, -40, 6, 40, theme.woodDark) + ShapeUtil.rect(52,
      -40, 6, 40, theme.woodDark)
    + ShapeUtil.rect(18, -40, 32, 22, theme.woodDark, { rx: 2 }) + ShapeUtil.rect(18, -40, 32, 4,
      ColorUtil.sh(theme.woodDark, -0.2)) + (hasParts ? ShapeUtil.rect(30, -32, 8, 2.5, theme.accent, { rx: 1 }) : "")
    + ShapeUtil.rect(-65, -46, 130, 7, theme.wood, { rx: 2 }) + ShapeUtil.rect(-65, -41, 130, 2,
      ColorUtil.sh(theme.wood, -0.22)) + (hasParts ? ShapeUtil.rect(-63, -46, 126, 1.5, ColorUtil.sh(theme.wood, 0.2)) : "")
    + grain;
  }
}
