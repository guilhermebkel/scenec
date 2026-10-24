import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class BirdAsset extends BaseAsset {
  readonly id = "bird";

  readonly kind = "sky";

  readonly width = 20;

  readonly height = 10;

  readonly tags = ["pássaro", "passaro", "gaivota", "birds"];

  draw(params: AssetParams,
    theme: Theme) {
    return `<path d="M-10 -6 Q-5 -11 0 -5 Q5 -11 10 -6" stroke="${theme.ink}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.75"/>`;
  }
}
