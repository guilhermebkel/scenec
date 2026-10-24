import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class HatchKit extends BaseKit {
  readonly id = "hatch";

  readonly desc = "engraving/comics: ink outline, hatched shadows instead of gradients, light paper";
  readonly outline = { w: 2.4, inner: 1.0 };
  readonly light = { mode: "hatch" };
  readonly texture = "paper";
  readonly colors = { shadow: "rgba(40,30,30,0.18)" };
}
