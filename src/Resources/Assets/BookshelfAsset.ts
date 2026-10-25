import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BookshelfAsset extends BaseAsset {
  readonly id = "bookshelf";

  readonly kind = "ground";

  readonly width = 80;

  readonly height = 170;

  readonly tags = ["estante", "shelf", "books"];

  draw(params: AssetParams, theme: Theme) {
    let svg = ShapeUtil.shadow(theme, 44, 3) + ShapeUtil.rect(-40, -170, 80, 170, theme.woodDark, { rx: 2 })
      + ShapeUtil.rect(-35, -165, 70, 160, ColorUtil.sh(theme.wood, -0.1));
    const cols = [theme.primary, theme.secondary, theme.accent, theme.paper, theme.primary, theme.secondary];
    for (let row = 0; row < 4; row++) {
      const base = -10 - row * 40;
      let posX = -33;
      let itemIndex = row;
      svg += ShapeUtil.rect(-35, base - 36, 70, 6, "rgba(0,0,0,0.12)");
      while (posX < 26) {
        const width = 6 + ((itemIndex * 5) % 5);
        const height = 22 + ((itemIndex * 7) % 9);
        const color = cols[itemIndex % cols.length] ?? theme.primary;
        svg += ShapeUtil.rect(posX, base - height, width, height, color, { rx: 1 })
          + ShapeUtil.rect(posX + width * 0.6, base - height, width * 0.4, height, ColorUtil.sh(color, -0.15))
          + ShapeUtil.rect(posX, base - height + 4, width, 1.5, ColorUtil.sh(color, -0.3));
        posX += width + 1;
        itemIndex++;
      }
      svg += ShapeUtil.rect(-35, base, 70, 5, theme.woodDark);
    }
    return svg + ShapeUtil.rect(26, -170, 14, 170, ColorUtil.sh(theme.woodDark, -0.15));
  }
}
