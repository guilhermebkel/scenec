import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class StethoscopeAsset extends BaseAsset {
  readonly id = "stethoscope";

  readonly kind = "surface";

  readonly width = 36;

  readonly height = 38;

  readonly tags = ["estetoscopio", "stethoscope", "doctor", "health", "medical"];

  draw(params: AssetParams, theme: Theme) {
    const tubeColor = ShapeUtil.color(theme, params.color, theme.secondary);
    const metalColor = theme.metal;
    return `<path d="M-12 -36 L-12 -28 Q-12 -18 0 -18 Q12 -18 12 -28 L12 -36" stroke="${metalColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
      + ShapeUtil.circle(-12, -37, 2, theme.ink)
      + ShapeUtil.circle(12, -37, 2, theme.ink)
      + `<path d="M0 -18 Q0 -6 10 -4 Q18 -2 14 0" stroke="${tubeColor}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      + ShapeUtil.circle(14, 0, 5, metalColor)
      + ShapeUtil.circle(14, 0, 3, ColorUtil.sh(metalColor, -0.25));
  }
}
