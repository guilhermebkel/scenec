import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class MoonAsset extends BaseAsset {
  readonly id = "moon";

  readonly kind = "sky";

  readonly width = 60;

  readonly height = 60;

  readonly tags = ["lua"];

  draw(params: AssetParams, theme: Theme) {
    const faint = "opacity=\"0.12\"";
    return ShapeUtil.circle(4, -32, 34, theme.primary, faint)
      + `<path d="M10 -58 A28 28 0 1 0 22 -10 A22 22 0 1 1 10 -58 Z" fill="${theme.primary}"/>`
      + ShapeUtil.circle(-6, -28, 3, theme.ink, faint) + ShapeUtil.circle(4, -16, 2, theme.ink, faint);
  }
}
