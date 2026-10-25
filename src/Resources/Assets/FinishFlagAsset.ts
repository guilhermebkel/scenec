import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FinishFlagAsset extends BaseAsset {
  readonly id = "finish_flag";

  readonly kind = "ground";

  readonly width = 50;

  readonly height = 90;

  readonly tags = ["bandeira de chegada", "chegada", "finish", "bandeira quadriculada"];

  draw(params: AssetParams, theme: Theme) {
    let svg = ShapeUtil.shadow(theme, 10, 2)
      + `<path d="M0 0 L0 -90" stroke="${theme.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
    for (let index = 0; index < 4; index++) {
      for (let innerIndex = 0; innerIndex < 3; innerIndex++) {
        svg += ShapeUtil.rect(2
          + index * 10, -88 + innerIndex * 10 + (index % 2 ? 1 : 0), 10, 10, (index + innerIndex) % 2
          ? theme.ink
          : theme.paper);
      }
    }
    return svg + ShapeUtil.rect(2, -88, 40, 30, "none", { rx: 0, extra: `stroke="${theme.ink}" stroke-width="1.2"` });
  }
}
