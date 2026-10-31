import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BlackboardAsset extends BaseAsset {
  readonly id = "blackboard";

  readonly kind = "wall";

  readonly width = 140;

  readonly height = 95;

  readonly elevation = 60;

  readonly tags = ["lousa", "quadro_negro", "blackboard", "chalkboard", "chalk"];

  draw(params: AssetParams, theme: Theme) {
    const frame = theme.woodDark;
    const boardBg = "#22332B";
    const chalk = "rgba(255, 255, 255, 0.75)";
    return ShapeUtil.rect(-70, -95, 140, 95, frame, { rx: 3 })
      + ShapeUtil.rect(-65, -90, 130, 85, boardBg, { rx: 1 })
      + ShapeUtil.rect(-68, -4, 136, 4, ColorUtil.sh(frame, -0.2), { rx: 1 })
      + ShapeUtil.rect(-40, -6, 12, 3, chalk, { rx: 0.5 })
      + ShapeUtil.rect(10, -7, 16, 5, theme.wood, { rx: 1 })
      + `<path d="M-50 -70 L-40 -50 L-30 -70" stroke="${chalk}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      + `<path d="M-15 -60 L15 -60 M0 -75 L0 -45" stroke="${chalk}" stroke-width="2" stroke-linecap="round"/>`
      + `<path d="M30 -50 Q45 -70 55 -50" stroke="${chalk}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
}
