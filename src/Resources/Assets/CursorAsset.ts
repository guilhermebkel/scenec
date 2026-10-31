import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class CursorAsset extends BaseAsset {
  readonly id = "cursor";

  readonly kind = "wall";

  readonly width = 32;

  readonly height = 38;

  readonly elevation = 90;

  readonly tags = ["cursor", "mouse_pointer", "pointer", "arrow", "mouse"];

  draw(params: AssetParams, theme: Theme) {
    const fill = theme.paper;
    const stroke = theme.ink;
    return `<path d="M-10 -36 L6 -24 L-1 -21 L3 -12 L-1 -10 L-5 -19 L-10 -15 Z" `
      + `fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
}
