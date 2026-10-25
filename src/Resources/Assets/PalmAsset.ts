import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PalmAsset extends BaseAsset {
  readonly id = "palm";

  readonly kind = "ground";

  readonly width = 200;

  readonly height = 262;

  readonly tags = ["palmeira", "coqueiro", "palm_tree"];

  draw(params: AssetParams, theme: Theme) {
    const [first, second] = theme.foliage;
    const leaf = (ang: number, len: number, colr: string): string => {
      const posX = Math.cos(ShapeUtil.toRadians(ang)) * len;
      const posY = -Math.sin(ShapeUtil.toRadians(ang)) * len;
      const midX = ShapeUtil.round(30 + posX * 0.5);
      const tipX = ShapeUtil.round(30 + posX);
      const tipY = ShapeUtil.round(-200 + posY);
      return `<path d="M30 -200 Q${midX} ${ShapeUtil.round(-200 + posY * 0.5 - 25)} ${tipX} ${tipY} `
        + `Q${ShapeUtil.round(30 + posX * 0.45)} ${ShapeUtil.round(-200 + posY * 0.45 - 4)} 30 -200 Z" fill="${colr}"/>`
        + `<path d="M30 -200 Q${midX} ${ShapeUtil.round(-200 + posY * 0.5 - 18)} ${tipX} ${tipY}" `
        + `stroke="${ColorUtil.sh(colr, -0.2)}" stroke-width="1.5" fill="none"/>`;
    };
    let trunk = `<path d="M-8 0 Q-6 -110 26 -200 L34 -198 Q6 -110 8 0 Z" fill="${theme.trunk}"/>`;
    for (let index = 1; index < 9; index++) {
      const coordY = -index * 22;
      const coordX = -7 + (index / 9) ** 2 * 33;
      trunk += `<path d="M${ShapeUtil.round(coordX - 1)} ${coordY} l9 -3" stroke="${ColorUtil.sh(theme.trunk, -0.22)}" `
        + `stroke-width="2" stroke-linecap="round"/>`;
    }
    const fronds = [15, 40, 140, 165, 195, -15].map((angle, outerIndex) => (
      leaf(angle, 70, outerIndex % 2 ? first : second)
    ));
    return ShapeUtil.shadow(theme, 40, 4.5) + trunk + fronds.join("")
      + leaf(90, 55, first) + ShapeUtil.circle(26, -194, 6, theme.woodDark)
      + ShapeUtil.circle(35, -192, 6, ColorUtil.sh(theme.woodDark, -0.15));
  }
}
