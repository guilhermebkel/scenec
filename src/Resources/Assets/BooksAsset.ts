import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BooksAsset extends BaseAsset {
  readonly id = "books";

  readonly kind = "surface";

  readonly w = 26;

  readonly h = 16;

  readonly tags = ["livros", "pilha de livros", "book_stack"];

  draw(p: any, t: any) { return [[-13, -5, 26, t.primary], [-11, -10, 23, t.secondary], [-12, -15, 21, t.accent]].map(([x, y, w, c]) => ShapeUtil.rect(x, y, w, 5, c, 1) + ShapeUtil.rect(x + w - 4, y, 4, 5, ColorUtil.sh(c, -0.18), 1) + ShapeUtil.rect(x + 2, y + 2, w - 7, 1, ColorUtil.sh(c, 0.35))).join(""); }
}
