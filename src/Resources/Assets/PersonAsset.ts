import { PersonUtil } from "@/Utils/PersonUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

export class PersonAsset extends BaseAsset {
  readonly id = "person";

  readonly kind = "ground";

  readonly w = 40;

  readonly h = 108;

  readonly tags = ["pessoa", "human", "character", "man", "woman", "personagem"];

  draw(p: any, t: any) {
    return PersonUtil.person(p, t);
  }
}
