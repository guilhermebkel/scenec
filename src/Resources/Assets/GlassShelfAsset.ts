import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class GlassShelfAsset extends BaseAsset {
  readonly id = "glass_shelf";

  readonly kind = "ground";

  readonly isHollow = true;

  readonly width = 14;

  readonly height = 46;

  readonly top = 46;

  readonly tags = ["prateleira de vidro", "vidro", "glass shelf"];

  size(params: AssetParams) {
    return ({ w: params.width ?? 14, h: params.height ?? 46 });
  }

  topOf(params: AssetParams) {
    return params.height ?? 46;
  }

  draw(params: AssetParams, theme: Theme) {
    const wide = params.width ?? 14, tall = params.height ?? 46;
    return `<path d="M${-wide / 2} ${-tall + 1.6} L${wide / 2} ${-tall + 1.6} L${wide / 2} ${-tall} L${-wide / 2 + 2} ${-tall} Z" fill="${theme.glass}" opacity="0.55"/>`
      + `<path d="M${-wide / 2} ${-tall + 1.6} L${wide / 2} ${-tall + 1.6}" stroke="${ColorUtil.sh(theme.glass, -0.35)}" stroke-width="0.5"/>`
      + ShapeUtil.rect(-wide / 2, -tall + 1.6, wide, 1.2, theme.ink, { rx: 0, extra: "opacity=\"0.08\"" });
  }
}
