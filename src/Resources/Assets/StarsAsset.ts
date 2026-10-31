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

  private static readonly POINTS: readonly [number, number][] = [
    [-280, -180], [-230, -165], [-170, -190], [-120, -175], [-60, -185],
    [0, -170], [60, -190], [120, -165], [180, -185], [240, -175], [285, -190],
    [-250, -140], [-180, -125], [-100, -135], [-30, -145], [40, -130],
    [130, -140], [210, -125], [270, -145],
    [-210, -90], [-80, -85], [80, -95], [200, -80],
    [-150, -50], [140, -45],
  ];

  private static readonly LARGE_RADIUS = 2.2;

  private static readonly SMALL_RADIUS = 1.3;

  private static readonly MAX_ALTITUDE = 200;

  private static readonly BASE_OPACITY = 0.5;

  private static readonly CYCLE = 3;

  draw(params: AssetParams, theme: Theme) {
    let svg = "";
    StarsAsset.POINTS.forEach(([posX, posY], index) => {
      // Why: stars fade and become sparser toward the horizon because of atmospheric glow.
      const altitude = Math.abs(posY) / StarsAsset.MAX_ALTITUDE;
      const opacity = Math.min(1, altitude ** 1.2 * (StarsAsset.BASE_OPACITY + (index % StarsAsset.CYCLE) * 0.2));
      const radius = index % StarsAsset.CYCLE === 0 ? StarsAsset.LARGE_RADIUS : StarsAsset.SMALL_RADIUS;
      svg += ShapeUtil.circle(posX, posY, radius, theme.paper, `opacity="${opacity.toFixed(2)}"`);
    });
    return svg;
  }
}
