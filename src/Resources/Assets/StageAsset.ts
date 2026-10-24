import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class StageAsset extends BaseAsset {
  readonly id = "stage";

  readonly kind = "ground";

  readonly width = 180;

  readonly height = 130;

  readonly tags = ["palco", "cerimônia", "cerimonia", "formatura", "ceremony"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.col(theme, params.color, theme.primary), darker = ColorUtil.sh(mainColor, -0.18);
    return ShapeUtil.shadow(theme, 96, 5) + ShapeUtil.rect(-86, -126, 8, 106, theme.woodDark) + ShapeUtil.rect(78, -126, 8, 106, theme.woodDark) + ShapeUtil.rect(-90, -132, 180, 10, theme.woodDark, 2)
      + `<path d="M-78 -122 Q-70 -60 -78 -20 L-50 -20 Q-56 -80 -40 -122 Z" fill="${mainColor}"/><path d="M78 -122 Q70 -60 78 -20 L50 -20 Q56 -80 40 -122 Z" fill="${darker}"/>`
      + `<path d="M-40 -122 Q0 -108 40 -122 L40 -116 Q0 -100 -40 -116 Z" fill="${darker}"/>`
      + ShapeUtil.rect(-36, -112, 72, 18, theme.paper, 3) + ShapeUtil.rect(-26, -106, 52, 3, theme.ink, 1)
      + ShapeUtil.rect(-94, -22, 188, 22, ColorUtil.sh(theme.wood, -0.05), 2) + ShapeUtil.rect(-94, -22, 188, 5, ColorUtil.sh(theme.wood, 0.15), 2) + ShapeUtil.rect(-94, -6, 188, 6, ColorUtil.sh(theme.wood, -0.25))
      + ShapeUtil.rect(-14, -56, 28, 34, theme.woodDark, 2) + ShapeUtil.rect(-18, -60, 36, 6, ColorUtil.sh(theme.woodDark, -0.15), 2) + ShapeUtil.circle(0, -42, 5, theme.accent);
  }
}
