import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class WindowAsset extends BaseAsset {
  readonly id = "window";

  readonly kind = "wall";

  readonly w = 90;

  readonly h = 100;

  readonly elevation = 75;

  readonly tags = ["janela"];

  draw(p: any, t: any) {
    const night = p.view === "night", sky = night ? "#26305E" : t.glass;
    const fr = ShapeUtil.col(t, p.frame, t.paper);
    return ShapeUtil.rect(-45, -100, 90, 100, fr, 4) + ShapeUtil.rect(-39, -94, 78, 88, sky, 2) + ShapeUtil.rect(-39, -94, 78, 10, ColorUtil.sh(sky, -0.1))
      + (night
        ? ShapeUtil.circle(18, -72, 8, "#F5E6A8")
        : ShapeUtil.circle(-15, -40, 10, t.paper, "opacity=\"0.7\"") + ShapeUtil.circle(-4, -46, 13, t.paper, "opacity=\"0.7\"")
          + `<path d="M-30 -20 L-8 -88 M-18 -14 L4 -82" stroke="${t.paper}" stroke-width="4" opacity="0.35"/>`)
        + ShapeUtil.rect(-2, -94, 4, 88, fr) + ShapeUtil.rect(-39, -52, 78, 4, fr) + ShapeUtil.rect(-50, -4, 100, 6, fr, 2) + ShapeUtil.rect(-50, 0, 100, 2, ColorUtil.sh(fr, -0.18));
  }
}
