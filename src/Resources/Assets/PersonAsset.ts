import type { AssetDrawing, AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { PersonUtil } from "@/Utils/PersonUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class PersonAsset extends BaseAsset {
  readonly id = "person";

  readonly kind = "ground";

  readonly width = 40;

  readonly height = 108;

  readonly tags = ["pessoa", "human", "character", "man", "woman", "personagem"];

  draw(params: AssetParams, theme: Theme): AssetDrawing {
    return PersonUtil.person(params, theme);
  }
}
