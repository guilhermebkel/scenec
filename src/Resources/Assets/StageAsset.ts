import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class StageAsset extends BaseAsset {
  readonly id = "stage";

  readonly kind = "ground";

  readonly w = 180;

  readonly h = 130;

  readonly tags = ["palco", "cerimônia", "cerimonia", "formatura", "ceremony"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.primary), d = ColorUtil.sh(c, -0.18);
    return ShapeUtil.shadow(t, 96, 5) + ShapeUtil.rect(-86, -126, 8, 106, t.woodDark) + ShapeUtil.rect(78, -126, 8, 106, t.woodDark) + ShapeUtil.rect(-90, -132, 180, 10, t.woodDark, 2) +
          `<path d="M-78 -122 Q-70 -60 -78 -20 L-50 -20 Q-56 -80 -40 -122 Z" fill="${c}"/><path d="M78 -122 Q70 -60 78 -20 L50 -20 Q56 -80 40 -122 Z" fill="${d}"/>` +
          `<path d="M-40 -122 Q0 -108 40 -122 L40 -116 Q0 -100 -40 -116 Z" fill="${d}"/>` +
          ShapeUtil.rect(-36, -112, 72, 18, t.paper, 3) + ShapeUtil.rect(-26, -106, 52, 3, t.ink, 1) +
          ShapeUtil.rect(-94, -22, 188, 22, ColorUtil.sh(t.wood, -0.05), 2) + ShapeUtil.rect(-94, -22, 188, 5, ColorUtil.sh(t.wood, 0.15), 2) + ShapeUtil.rect(-94, -6, 188, 6, ColorUtil.sh(t.wood, -0.25)) +
          ShapeUtil.rect(-14, -56, 28, 34, t.woodDark, 2) + ShapeUtil.rect(-18, -60, 36, 6, ColorUtil.sh(t.woodDark, -0.15), 2) + ShapeUtil.circle(0, -42, 5, t.accent);
  }
}
