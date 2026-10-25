import type { KitLight } from "@/Protocols/KitProtocol.ts";
import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class SketchKit extends BaseKit {
  readonly id = "sketch";

  readonly description = "sketch: watercolor-washed colors and pencil lines on the edges";
  readonly light: KitLight = { mode: "none" };
  readonly scene = "sketch";
  readonly texture = "paper";
}
