import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class DiplomaAsset extends BaseAsset {
  readonly id = "diploma";

  readonly kind = "any";

  readonly width = 26;

  readonly height = 12;

  readonly tags = ["diploma", "canudo", "certificado"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-13, -10, 26, 10, theme.paper, { rx: 5 })
      + ShapeUtil.rect(-13, -10, 26, 4, ColorUtil.sh(theme.paper, 0.0), { rx: 5 }) + ShapeUtil.rect(-13, -4, 26, 4,
      ColorUtil.sh(theme.paper, -0.12), { rx: 2 }) + ShapeUtil.rect(-2, -11, 4, 12, theme.primary)
    + `<path d="M0 0 L-3 6 M0 0 L3 6" stroke="${theme.primary}" stroke-width="1.6"/>`;
  }
}
