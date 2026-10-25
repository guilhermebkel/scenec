import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BalloonsAsset extends BaseAsset {
  readonly id = "balloons";

  readonly kind = "ground";

  readonly width = 40;

  readonly height = 100;

  readonly tags = ["balões", "baloes", "festa", "party"];

  draw(params: AssetParams, theme: Theme) {
    const cs = [theme.primary, theme.accent, theme.secondary];
    return `<path d="M0 0 Q-6 -40 -12 -70 M0 0 Q2 -45 4 -82 M0 0 Q8 -36 16 -66" stroke="${theme.metal}" stroke-width="1" fill="none"/>`
      + ([[-12, -78, cs[0]], [4, -91, cs[1]], [16, -74, cs[2]]] as [number, number, string][]).map(([posX, posY,
        color]) => ShapeUtil.ellipse(posX, posY, 9, 11, color) + ShapeUtil.ellipse(posX - 3, posY - 4, 2.5, 3.5,
        { fill: theme.paper, extra: "opacity=\"0.45\"" })).join("");
  }
}
