import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class StarsAsset extends BaseAsset {
  readonly id = "stars";

  readonly kind = "sky";

  readonly isBackdrop = true;

  readonly width = 600;

  readonly height = 200;

  readonly tags = ["céu estrelado", "starfield"];

  draw(params: AssetParams, theme: Theme) {
    let svg = ""; const pts = [[-280, -170], [-210, -60], [-150, -140], [-90, -30], [-30, -180], [40, -90], [110,
      -160], [170, -40], [230, -130], [290, -190], [-250, -110], [70, -20], [-120, -190], [200, -100]];
    pts.forEach(([posX, posY], index) => {
      svg += ShapeUtil.circle(posX, posY, index % 3 === 0 ? 2.2 : 1.3,
        theme.paper, `opacity="${0.5 + (index % 4) * 0.12}"`);
    }); return svg;
  }
}
