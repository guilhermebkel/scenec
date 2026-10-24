import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class MonitorAsset extends BaseAsset {
  readonly id = "monitor";

  readonly kind = "surface";

  readonly w = 50;

  readonly h = 46;

  readonly tags = ["tela", "screen", "display"];

  draw(p: any, t: any) {
    return p.off
      ? ShapeUtil.rect(-3, -14, 6, 14, t.ink) + ShapeUtil.rect(-12, -2.5, 24, 2.5, t.ink, 1) + ShapeUtil.rect(-25, -46, 50, 33, t.ink, 2) + ShapeUtil.rect(-24, -45, 48, 30, ColorUtil.sh(t.ink, 0.12), 1) + `<path d="M-24 -45 L-6 -45 L-24 -25 Z" fill="#FFFFFF" opacity="0.06"/>`
      : ShapeUtil.rect(-4, -14, 8, 14, t.metal) + ShapeUtil.rect(-14, -3, 28, 3, t.metal, 1.5) + ShapeUtil.rect(-25, -46, 50, 33, t.ink, 3) + ShapeUtil.rect(-21, -42, 42, 25, t.glass, 1)
        + ShapeUtil.rect(-17, -38, 18, 3, t.primary, 1) + ShapeUtil.rect(-17, -32, 28, 2.5, t.paper, 1, "opacity=\"0.8\"") + ShapeUtil.rect(-17, -27, 22, 2.5, t.paper, 1, "opacity=\"0.8\"");
  }
}
