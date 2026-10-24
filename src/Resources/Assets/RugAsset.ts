import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class RugAsset extends BaseAsset {
  readonly id = "rug";

  readonly kind = "floor";

  readonly width = 180;

  readonly height = 14;

  readonly tags = ["tapete", "carpet"];

  draw(params: AssetParams, theme: Theme) { const mainColor = ShapeUtil.col(theme, params.color, theme.secondary); return ShapeUtil.ell(0, -2, 90, 10, mainColor, "opacity=\"0.22\"") + ShapeUtil.ell(0, -2, 76, 7, "none", `stroke="${mainColor}" stroke-width="2" opacity="0.35" stroke-dasharray="6 5"`); }
}
