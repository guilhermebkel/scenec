import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class PaperKit extends BaseKit {
  readonly id = "paper";

  readonly desc = "paper cut-out: each piece with its own shadow and fiber texture";
  readonly light = { strength: 0.18, casts: false };
  readonly drop = true;
  readonly texture = "fiber";
}
