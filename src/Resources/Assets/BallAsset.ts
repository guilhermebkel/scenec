import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BallAsset extends BaseAsset {
  readonly id = "ball";

  readonly kind = "ground";

  readonly width = 24;

  readonly height = 24;

  readonly tags = ["bola", "beach_ball"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.shadow(theme, 10, 2) + ShapeUtil.circle(0, -12, 12, theme.paper) + `<path d="M0 -24 A12 12 0 0 1 12 -12 L0 -12 Z" fill="${theme.primary}"/><path d="M0 0 A12 12 0 0 1 -12 -12 L0 -12 Z" fill="${theme.accent}"/>`
      + `<path d="M0 0 A12 12 0 0 0 12 -12 A12 12 0 0 1 2 -1 Z" fill="${theme.ink}" opacity="0.12"/>` + ShapeUtil.circle(-5, -18, 2.5, theme.paper, "opacity=\"0.7\"");
  }
}
