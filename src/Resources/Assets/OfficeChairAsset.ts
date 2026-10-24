import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class OfficeChairAsset extends BaseAsset {
  readonly id = "office_chair";

  readonly kind = "ground";

  readonly w = 42;

  readonly h = 60;

  readonly tags = ["cadeira de escritório", "cadeira presidente", "office chair", "gamer chair"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, "#1F1F24"), chrome = "#B9BEC4", d = ColorUtil.sh(c, 0.12);
    let s = ShapeUtil.shadow(t, 22, 2.2);
    // base em estrela
    [[-19, -2], [19, -2], [-11, 0.5], [11, 0.5], [0, -3.5]].forEach(([x, y]) => { s += `<path d="M0 -5 L${x} ${y}" stroke="${chrome}" stroke-width="2.2" stroke-linecap="round"/>` + ShapeUtil.circle(x, y + 0.6, 1.6, t.ink); });
    s += ShapeUtil.rect(-1.3, -16, 2.6, 11, chrome) + ShapeUtil.rect(-0.3, -16, 0.9, 11, "#FFFFFF", 0, "opacity=\"0.5\"");
    // assento e braços
    s += ShapeUtil.rect(-18, -21, 36, 6, ColorUtil.sh(c, 0.05), 3) + ShapeUtil.rect(-21, -29, 5, 13, c, 2) + ShapeUtil.rect(16, -29, 5, 13, c, 2) + ShapeUtil.rect(-21, -30, 6, 2.5, d, 1) + ShapeUtil.rect(15, -30, 6, 2.5, d, 1);
    if (p.draped) { s += `<path d="M-22 -31 Q-25 -22 -23 -12 L-17 -14 Q-18 -22 -16 -30 Z" fill="${ShapeUtil.col(t, p.draped === true ? "metal" : p.draped, t.metal)}"/>`; }
    // encosto alto acolchoado
    s += `<path d="M-15 -22 L-16 -52 Q-16 -60 -8 -60 L8 -60 Q16 -60 16 -52 L15 -22 Z" fill="${c}"/>`
      + `<path d="M-13 -55 Q0 -58 13 -55" stroke="${d}" stroke-width="1" fill="none"/><path d="M-13 -44 Q0 -46 13 -44" stroke="${d}" stroke-width="0.8" fill="none"/>`
      + `<path d="M-6 -57 L-6.5 -24 M6 -57 L6.5 -24" stroke="${d}" stroke-width="0.8"/>` + `<path d="M-14 -50 Q-15 -36 -13.5 -24" stroke="${ColorUtil.sh(c, 0.22)}" stroke-width="1.6" fill="none" opacity="0.7"/>`;
    return s;
  }
}
