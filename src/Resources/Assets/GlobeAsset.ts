import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class GlobeAsset extends BaseAsset {
  readonly id = "globe";

  readonly kind = "surface";

  readonly width = 36;

  readonly height = 50;

  readonly tags = ["globo", "globo_terrestre", "globe", "earth", "world_map"];

  draw(params: AssetParams, theme: Theme) {
    const metal = theme.metal;
    const ocean = ShapeUtil.color(theme, params.color, "#3B82F6");
    const land = theme.accent;
    return ShapeUtil.rect(-10, -4, 20, 4, metal, { rx: 2 })
      + ShapeUtil.rect(-2, -14, 4, 10, metal)
      + `<path d="M0 -14 A16 16 0 0 1 -14 -32" stroke="${metal}" stroke-width="2.5" fill="none"/>`
      + ShapeUtil.circle(0, -32, 14, ocean)
      + `<path d="M-8 -36 Q-2 -42 4 -38 Q8 -34 2 -30 Q-6 -26 -8 -36 Z" fill="${land}"/>`
      + `<path d="M-4 -26 Q2 -22 6 -24 Q8 -20 2 -18 Z" fill="${land}"/>`
      + ShapeUtil.circle(0, -32, 14, "none", "stroke=\"rgba(255,255,255,0.3)\" stroke-width=\"1\"");
  }
}
