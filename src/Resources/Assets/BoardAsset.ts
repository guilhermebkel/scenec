import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BoardAsset extends BaseAsset {
  readonly id = "board";

  readonly kind = "wall";

  readonly width = 170;

  readonly height = 100;

  readonly elevation = 60;

  readonly tags = ["quadro negro", "lousa", "whiteboard", "chalkboard", "chart"];

  private static readonly STYLE_TO_PALETTE: Record<"white", (theme: Theme) => { background: string; line: string }> = {
    white: (theme) => ({ background: theme.paper, line: theme.ink }),
  };

  draw(params: AssetParams, theme: Theme) {
    const palette = IdUtil.lookup(BoardAsset.STYLE_TO_PALETTE, params.style)?.(theme)
      ?? { background: "#2F5446", line: "#EAF2E6" };
    const bg = palette.background;
    const ln = palette.line;
    const barColors = [theme.primary, theme.accent, theme.secondary, theme.primary];
    const bars = [30, 52, 40, 70].map((value, index) => {
      const color = barColors[index] ?? theme.primary;
      const shade = ColorUtil.sh(color, -0.15);
      return ShapeUtil.rect(-60 + index * 26, -18 - value, 16, value, color, { rx: 2 })
        + ShapeUtil.rect(-52 + index * 26, -18 - value, 8, value, shade, { rx: 0 });
    }).join("");
    return ShapeUtil.rect(-83, -98, 170, 100, "rgba(0,0,0,0.1)", { rx: 4 }) + ShapeUtil.rect(-85, -100, 170, 100,
      theme.woodDark, { rx: 4 }) + ShapeUtil.rect(-79, -94, 158, 88, bg, { rx: 2 })
    + `<path d="M-79 -94 L-40 -94 L-79 -50 Z" fill="${theme.paper}" opacity="0.05"/>` + bars
    + `<path d="M-68 -18 L54 -18" stroke="${ln}" stroke-width="2"/>`
    + `<path d="M-62 -55 Q-30 -60 -10 -75 T50 -92" stroke="${ln}" stroke-width="2.5" fill="none" `
    + `stroke-dasharray="5 4"/>`
    + ShapeUtil.rect(-40, -2, 80, 5, theme.woodDark, { rx: 2 }) + ShapeUtil.rect(-30, -5, 8, 3, theme.paper,
      { rx: 1 });
  }
}
