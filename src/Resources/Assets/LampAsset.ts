import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LampAsset extends BaseAsset {
  readonly id = "lamp";

  readonly kind = "surface";

  readonly width = 30;

  readonly height = 42;

  readonly tags = ["luminária", "luminaria", "desk_lamp"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-10, -3, 20, 3, theme.ink, { rx: 1.5 })
      + `<path d="M-2 -3 L-8 -26 L8 -36" stroke="${theme.ink}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`
      + `<path d="M2 -42 L18 -30 L10 -24 Z" fill="${theme.accent}"/><path d="M10 -36 L18 -30 L10 -24 Z" fill="${ColorUtil.sh(theme.accent, -0.15)}"/>`
      + `<path d="M14 -27 L26 -2 L-2 -2 Z" fill="${theme.accent}" opacity="0.13"/>`;
  }
}
