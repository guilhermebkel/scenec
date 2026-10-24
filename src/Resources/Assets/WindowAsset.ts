import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class WindowAsset extends BaseAsset {
  readonly id = "window";

  readonly kind = "wall";

  readonly width = 90;

  readonly height = 100;

  readonly elevation = 75;

  readonly tags = ["janela"];

  draw(params: AssetParams, theme: Theme) {
    const night = params.view === "night", sky = night ? "#26305E" : theme.glass;
    const fr = ShapeUtil.color(theme, params.frame, theme.paper);
    return ShapeUtil.rect(-45, -100, 90, 100, fr, { rx: 4 }) + ShapeUtil.rect(-39, -94, 78, 88, sky, { rx: 2 })
      + ShapeUtil.rect(-39, -94, 78, 10, ColorUtil.sh(sky, -0.1))
      + (night
        ? ShapeUtil.circle(18, -72, 8, "#F5E6A8")
        : ShapeUtil.circle(-15, -40, 10, theme.paper, "opacity=\"0.7\"") + ShapeUtil.circle(-4, -46, 13, theme.paper,
          "opacity=\"0.7\"")
        + `<path d="M-30 -20 L-8 -88 M-18 -14 L4 -82" stroke="${theme.paper}" stroke-width="4" opacity="0.35"/>`)
      + ShapeUtil.rect(-2, -94, 4, 88, fr) + ShapeUtil.rect(-39, -52, 78, 4, fr) + ShapeUtil.rect(-50, -4, 100, 6,
      fr, { rx: 2 }) + ShapeUtil.rect(-50, 0, 100, 2, ColorUtil.sh(fr, -0.18));
  }
}
