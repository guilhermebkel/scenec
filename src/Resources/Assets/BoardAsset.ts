import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BoardAsset extends BaseAsset {
  readonly id = "board";

  readonly kind = "wall";

  readonly w = 170;

  readonly h = 100;

  readonly elevation = 60;

  readonly tags = ["quadro negro", "lousa", "whiteboard", "chalkboard", "chart"];

  draw(p: any, t: any) {
    const bg = p.style === "white" ? t.paper : "#2F5446", ln = p.style === "white" ? t.ink : "#EAF2E6";
    const bars = [30, 52, 40, 70].map((v, i) => { const c = [t.primary, t.accent, t.secondary, t.primary][i]; return ShapeUtil.rect(-60 + i * 26, -18 - v, 16, v, c, 2) + ShapeUtil.rect(-52 + i * 26, -18 - v, 8, v, ColorUtil.sh(c, -0.15), 0); }).join("");
    return ShapeUtil.rect(-83, -98, 170, 100, "rgba(0,0,0,0.1)", 4) + ShapeUtil.rect(-85, -100, 170, 100, t.woodDark, 4) + ShapeUtil.rect(-79, -94, 158, 88, bg, 2) +
          `<path d="M-79 -94 L-40 -94 L-79 -50 Z" fill="${t.paper}" opacity="0.05"/>` + bars +
          `<path d="M-68 -18 L54 -18" stroke="${ln}" stroke-width="2"/><path d="M-62 -55 Q-30 -60 -10 -75 T50 -92" stroke="${ln}" stroke-width="2.5" fill="none" stroke-dasharray="5 4"/>` +
          ShapeUtil.rect(-40, -2, 80, 5, t.woodDark, 2) + ShapeUtil.rect(-30, -5, 8, 3, t.paper, 1);
  }
}
