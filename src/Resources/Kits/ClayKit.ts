import type { KitLight } from "@/Protocols/KitProtocol.ts";
import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class ClayKit extends BaseKit {
  readonly id = "clay";

  readonly description = "clay: soft 3D rounded shapes, rim light and ambient occlusion";

  readonly light: KitLight = { strength: 0.55 };

  readonly hasDrop = true;

  readonly scene = "clay";
}
