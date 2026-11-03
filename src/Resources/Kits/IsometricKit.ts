import type { KitLight } from "@/Protocols/KitProtocol.ts";
import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class IsometricKit extends BaseKit {
  readonly id = "isometric";

  readonly description = "isometric: 30° axonometric projection with flat faces, hatched shadow planes and a drop shadow";

  readonly light: KitLight = { mode: "hatch", strength: 0.6 };

  readonly hasDrop = true;
}
