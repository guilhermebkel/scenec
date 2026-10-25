import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SuitcaseAsset extends BaseAsset {
  readonly id = "suitcase";

  readonly kind = "any";

  readonly width = 30;

  readonly height = 46;

  readonly tags = ["mala", "luggage", "bagagem"];

  draw(params: AssetParams, theme: Theme) {
    const mainColor = ShapeUtil.color(theme, params.color, theme.accent);
    return `<path d="M-6 -36 L-6 -44 L6 -44 L6 -36" stroke="${theme.ink}" stroke-width="2.5" fill="none"/>`
      + ShapeUtil.rect(-15, -38, 30, 36, mainColor, { rx: 4 }) + ShapeUtil.rect(5, -38, 10, 36,
      ColorUtil.sh(mainColor, -0.15), { rx: 4 })
    + ShapeUtil.rect(-8, -38, 2, 36, ColorUtil.sh(mainColor, -0.25)) + ShapeUtil.rect(6, -38, 2, 36,
      ColorUtil.sh(mainColor, -0.3)) + ShapeUtil.circle(-9, -1, 2.5, theme.ink) + ShapeUtil.circle(9, -1, 2.5,
      theme.ink) + ShapeUtil.circle(-2, -30, 3, theme.primary) + ShapeUtil.rect(-12, -18, 8, 6, theme.paper,
      { rx: 1, extra: "transform=\"rotate(-10 -8 -15)\"" });
  }
}
