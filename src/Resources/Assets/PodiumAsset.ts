import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PodiumAsset extends BaseAsset {
  readonly id = "podium";

  readonly kind = "ground";

  readonly width = 50;

  readonly height = 95;

  readonly top = 95;

  readonly tags = ["pulpito", "podio", "podium", "lectern", "speech", "stage_stand"];

  draw(params: AssetParams, theme: Theme) {
    const wood = ShapeUtil.color(theme, params.color, theme.woodDark);
    const shade = ColorUtil.sh(wood, -0.2);
    const mic = theme.metal;
    return ShapeUtil.shadow(theme, 26, 4)
      + ShapeUtil.rect(-22, -10, 44, 10, wood, { rx: 2 })
      + `<path d="M-16 -10 L-12 -80 L12 -80 L16 -10 Z" fill="${wood}"/>`
      + `<path d="M0 -10 L2 -80 L12 -80 L16 -10 Z" fill="${shade}"/>`
      + ShapeUtil.rect(-25, -88, 50, 10, wood, { rx: 3 })
      + ShapeUtil.rect(-15, -92, 30, 4, theme.paper, { rx: 1 })
      + `<path d="M12 -88 Q18 -100 14 -106" stroke="${mic}" stroke-width="2" fill="none"/>`
      + ShapeUtil.circle(14, -107, 3, mic);
  }
}
