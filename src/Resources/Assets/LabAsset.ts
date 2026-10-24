import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LabAsset extends BaseAsset {
  readonly id = "lab";

  readonly kind = "ground";

  readonly w = 160;

  readonly h = 140;

  readonly tags = ["laboratório", "laboratorio", "centro de pesquisa", "research"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.secondary);
    let s = ShapeUtil.shadow(t, 86, 5) + ShapeUtil.rect(-80, -100, 160, 100, c) + ShapeUtil.rect(30, -100, 50, 100, ColorUtil.sh(c, -0.14)) + ShapeUtil.rect(-84, -106, 168, 8, ColorUtil.sh(c, -0.3));
    for (let y = -88; y < -20; y += 22) for (let x = -70; x < 70; x += 24) s += ShapeUtil.rect(x, y, 18, 14, t.glass, 1) + ShapeUtil.rect(x, y + 10, 18, 4, ColorUtil.sh(t.glass, -0.12));
    s += ShapeUtil.rect(-16, -30, 32, 30, ColorUtil.sh(c, -0.35), 2) + ShapeUtil.rect(-14, -28, 13, 28, t.glass, 1, "opacity=\"0.8\"") + ShapeUtil.rect(1, -28, 13, 28, t.glass, 1, "opacity=\"0.8\"");
    // dome do observatório + frasco no letreiro
    s += `<path d="M30 -106 A26 26 0 0 1 82 -106 Z" fill="${t.metal}"/><path d="M56 -132 A26 26 0 0 1 82 -106 L56 -106 Z" fill="${ColorUtil.sh(t.metal, -0.15)}"/><path d="M52 -128 L70 -140" stroke="${t.ink}" stroke-width="4" stroke-linecap="round"/>`;
    s += ShapeUtil.rect(-60, -128, 54, 20, t.paper, 4) + `<path d="M-46 -125 L-46 -119 L-51 -111 L-37 -111 L-42 -119 L-42 -125 Z" fill="${t.accent}"/>` + ShapeUtil.rect(-33, -121, 22, 3, t.ink, 1) + ShapeUtil.rect(-33, -115, 16, 3, t.ink, 1);
    return s;
  }
}
