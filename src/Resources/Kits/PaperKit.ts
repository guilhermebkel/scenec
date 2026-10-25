import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class PaperKit extends BaseKit {
  readonly id = "paper";

  readonly description = "paper cut-out: each piece with its own shadow and fiber texture";
  readonly light = { strength: 0.18, hasCasts: false };
  readonly hasDrop = true;
  readonly texture = "fiber";
}
