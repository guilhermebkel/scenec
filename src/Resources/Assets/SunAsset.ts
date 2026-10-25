import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SunAsset extends BaseAsset {
  readonly id = "sun";

  readonly kind = "sky";

  readonly width = 90;

  readonly height = 90;

  readonly tags = ["sol"];

  draw(params: AssetParams, theme: Theme) {
    let svg = "";
    for (let first = 0; first < 360; first += 30) {
      const cosine = Math.cos(ShapeUtil.toRadians(first));
      const sine = Math.sin(ShapeUtil.toRadians(first));
      svg += `<path d="M${ShapeUtil.round(cosine * 34)} ${ShapeUtil.round(-45 + sine * 34)} `
        + `L${ShapeUtil.round(cosine * 44)} ${ShapeUtil.round(-45 + sine * 44)}" `
        + `stroke="${theme.accent}" stroke-width="5" stroke-linecap="round"/>`;
    }
    return ShapeUtil.circle(0, -45, 31, theme.accent, "opacity=\"0.25\"") + svg
      + ShapeUtil.circle(0, -45, 26, theme.accent)
      + `<path d="M-16 -55 A20 20 0 0 1 4 -66" stroke="${ColorUtil.sh(theme.accent, 0.45)}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
}
