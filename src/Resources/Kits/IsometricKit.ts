import type { KitLight, KitOutline } from "@/Protocols/KitProtocol.ts";
import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class IsometricKit extends BaseKit {
  readonly id = "isometric";

  readonly description = "isometric: 30° axonometric projection with crisp outline and directional light";

  readonly outline: KitOutline = { w: 1.8, inner: 0.8 };

  readonly light: KitLight = { strength: 0.5 };
}
