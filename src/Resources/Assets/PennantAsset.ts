import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PennantAsset extends BaseAsset {
  readonly id = "pennant";

  readonly kind = "ground";

  readonly width = 30;

  readonly height = 70;

  readonly tags = ["bandeirinha", "flag"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.shadow(theme, 7, 1.6)
      + `<path d="M0 0 L0 -70" stroke="${theme.metal}" stroke-width="2.5"/><path d="M1 -70 L28 -62 L1 -54 Z" fill="${ShapeUtil.color(theme, params.color, theme.accent)}"/>`;
  }
}
