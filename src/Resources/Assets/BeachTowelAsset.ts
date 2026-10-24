import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class BeachTowelAsset extends BaseAsset {
  readonly id = "beach_towel";

  readonly kind = "floor";

  readonly width = 90;

  readonly height = 10;

  readonly tags = ["toalha", "towel"];

  draw(params: AssetParams,
    theme: Theme) {
    return `<path d="M-45 0 L-35 -9 L45 -9 L35 0 Z" fill="${theme.secondary}"/><path d="M-25 0 L-15 -9 L-5 -9 L-15 0 Z M5 0 L15 -9 L25 -9 L15 0 Z" fill="${theme.paper}"/>`;
  }
}
