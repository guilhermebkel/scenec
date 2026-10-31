import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ConfettiAsset extends BaseAsset {
  readonly id = "confetti";

  readonly kind = "sky";

  readonly width = 80;

  readonly height = 80;

  readonly tags = ["confete", "confetes", "confetti", "party", "celebration", "streamers"];

  draw(params: AssetParams, theme: Theme) {
    const primary = theme.primary;
    const accent = theme.accent;
    const secondary = theme.secondary;
    return ShapeUtil.rect(-30, -70, 8, 4, primary, { extra: "transform=\"rotate(25 -30 -70)\"" })
      + ShapeUtil.rect(20, -65, 7, 4, accent, { extra: "transform=\"rotate(-35 20 -65)\"" })
      + ShapeUtil.rect(-15, -45, 6, 3, secondary, { extra: "transform=\"rotate(40 -15 -45)\"" })
      + ShapeUtil.rect(25, -35, 8, 4, primary, { extra: "transform=\"rotate(15 25 -35)\"" })
      + ShapeUtil.rect(-35, -20, 7, 4, accent, { extra: "transform=\"rotate(-20 -35 -20)\"" })
      + ShapeUtil.rect(5, -15, 6, 3, secondary, { extra: "transform=\"rotate(30 5 -15)\"" })
      + ShapeUtil.circle(-5, -60, 2.5, accent)
      + ShapeUtil.circle(35, -50, 2, primary)
      + ShapeUtil.circle(-25, -35, 2, secondary)
      + ShapeUtil.circle(10, -40, 2.5, accent)
      + `<path d="M-20 -75 Q-10 -70 -12 -55" stroke="${accent}" stroke-width="1.8" fill="none"/>`
      + `<path d="M15 -70 Q25 -60 18 -45" stroke="${primary}" stroke-width="1.8" fill="none"/>`;
  }
}
