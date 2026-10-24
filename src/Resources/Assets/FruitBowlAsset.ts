import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FruitBowlAsset extends BaseAsset {
  readonly id = "fruit_bowl";

  readonly kind = "surface";

  readonly width = 34;

  readonly height = 22;

  readonly tags = ["frutas", "fruteira", "fruit"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.circle(-7, -14, 6, theme.primary) + ShapeUtil.circle(6, -14, 6, theme.accent) + ShapeUtil.circle(0, -19, 6, "#8DBA4A") + ShapeUtil.circle(-2, -21, 1.5, "#FFFFFF", "opacity=\"0.4\"")
      + `<path d="M-6 -24 L-5 -27" stroke="${theme.trunk}" stroke-width="1.5"/>` + `<path d="M-17 -12 L17 -12 Q15 0 0 0 Q-15 0 -17 -12 Z" fill="${theme.secondary}"/><path d="M4 -12 L17 -12 Q15 0 3 0 Z" fill="${ColorUtil.sh(theme.secondary, -0.15)}"/>`;
  }
}
