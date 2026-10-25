import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BooksAsset extends BaseAsset {
  readonly id = "books";

  readonly kind = "surface";

  readonly width = 26;

  readonly height = 16;

  readonly tags = ["livros", "pilha de livros", "book_stack"];

  draw(params: AssetParams, theme: Theme) {
    return ([[-13, -5, 26, theme.primary], [-11, -10, 23, theme.secondary],
      [-12, -15, 21, theme.accent]] as [number, number, number, string][]).map(([posX, posY, width,
      color]) => ShapeUtil.rect(posX, posY, width, 5, color, { rx: 1 }) + ShapeUtil.rect(posX + width - 4, posY, 4, 5,
      ColorUtil.sh(color, -0.18), { rx: 1 }) + ShapeUtil.rect(posX + 2, posY + 2, width - 7, 1, ColorUtil.sh(color,
      0.35))).join("");
  }
}
