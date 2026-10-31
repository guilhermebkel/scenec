import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class WhiteboardAsset extends BaseAsset {
  readonly id = "whiteboard";

  readonly kind = "ground";

  readonly width = 120;

  readonly height = 150;

  readonly tags = ["quadro_branco", "lousa_branca", "whiteboard", "flipchart", "board_stand"];

  draw(params: AssetParams, theme: Theme) {
    const stand = theme.metal;
    const tray = ColorUtil.sh(theme.metal, -0.2);
    return ShapeUtil.shadow(theme, 55, 4)
      + `<path d="M-45 0 L-35 -140 M45 0 L35 -140" stroke="${stand}" stroke-width="4" stroke-linecap="round"/>`
      + `<path d="M-40 -40 L40 -40" stroke="${stand}" stroke-width="3"/>`
      + ShapeUtil.rect(-55, -145, 110, 80, stand, { rx: 4 })
      + ShapeUtil.rect(-51, -141, 102, 72, theme.paper, { rx: 2 })
      + ShapeUtil.rect(-45, -67, 90, 4, tray, { rx: 1 })
      + `<path d="M-40 -125 Q-20 -130 0 -115 T40 -120" stroke="${theme.primary}" stroke-width="2.5" fill="none"/>`
      + ShapeUtil.rect(-35, -105, 18, 12, theme.accent, { rx: 2 })
      + ShapeUtil.rect(-10, -105, 18, 12, theme.secondary, { rx: 2 })
      + ShapeUtil.rect(15, -105, 18, 12, theme.primary, { rx: 2 });
  }
}
