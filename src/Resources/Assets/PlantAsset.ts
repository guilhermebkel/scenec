import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PlantAsset extends BaseAsset {
  readonly id = "plant";

  readonly kind = "any";

  readonly width = 36;

  readonly height = 46;

  readonly tags = ["planta", "vaso", "plant_pot"];

  draw(params: AssetParams, theme: Theme) {
    const [first, second] = theme.foliage;
    return `<path d="M0 -16 Q-18 -30 -14 -46 Q-4 -32 0 -16 Z" fill="${first}"/><path d="M0 -16 Q16 -28 15 -42 Q3 -32 0 -16 Z" fill="${second}"/><path d="M0 -16 Q-2 -36 3 -48 Q6 -34 0 -16 Z" fill="${ColorUtil.sh(first, -0.12)}"/>`
      + `<path d="M-11 -16 L11 -16 L8 0 L-8 0 Z" fill="${theme.primary}"/><path d="M2 -16 L11 -16 L8 0 L2 0 Z" fill="${ColorUtil.sh(theme.primary, -0.15)}"/>`
      + ShapeUtil.rect(-12, -18, 24, 4, ColorUtil.sh(theme.primary, -0.08), { rx: 1 });
  }
}
