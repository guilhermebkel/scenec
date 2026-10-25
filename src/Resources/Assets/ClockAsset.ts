import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ClockAsset extends BaseAsset {
  readonly id = "clock";

  readonly kind = "wall";

  readonly width = 34;

  readonly height = 34;

  readonly elevation = 120;

  readonly tags = ["relógio", "relogio"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.circle(1, -16, 17, "rgba(0,0,0,0.08)") + ShapeUtil.circle(0, -17, 17, theme.paper,
      `stroke="${theme.ink}" stroke-width="3"`)
    + [0, 90, 180, 270].map((first) => ShapeUtil.circle(Math.cos(ShapeUtil.toRadians(first)) * 11.5, -17
    + Math.sin(ShapeUtil.toRadians(first)) * 11.5, 1.2, theme.ink)).join("")
  + `<path d="M0 -17 L0 -28 M0 -17 L8 -13" stroke="${theme.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
}
