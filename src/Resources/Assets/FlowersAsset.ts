import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FlowersAsset extends BaseAsset {
  readonly id = "flowers";

  readonly kind = "ground";

  readonly width = 50;

  readonly height = 30;

  readonly tags = ["flores", "canteiro", "flower_bed"];

  draw(params: AssetParams, theme: Theme) {
    const [first, second] = theme.foliage; let svg = ShapeUtil.shadow(theme, 24, 2.5);
    ([[-16, -16, theme.primary], [-4, -24, theme.accent], [9, -18, theme.paper], [19, -12, theme.primary], [-20, -8, theme.accent]] as Array<[number, number, string]>).forEach(([posX, posY, color]) => {
      svg += `<path d="M${posX} 0 Q${posX + 1} ${posY / 2} ${posX} ${posY}" stroke="${second}" stroke-width="2" fill="none"/>` + [0, 72, 144, 216, 288].map((angle) => ShapeUtil.circle(posX + Math.cos(ShapeUtil.rad(angle)) * 3, posY + Math.sin(ShapeUtil.rad(angle)) * 3, 2.6, color)).join("") + ShapeUtil.circle(posX, posY, 1.8, theme.accent === color ? theme.paper : theme.accent);
    });
    return svg + ShapeUtil.ell(0, -2, 24, 4, first);
  }
}
