import type { KitLight } from "@/Protocols/KitProtocol.ts";
import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class PosterKit extends BaseKit {
  readonly id = "poster";

  readonly description = "vintage poster: limited 4–5 colors, coarse halftone shadows, sun-faded grade";

  readonly light: KitLight = { mode: "none" };

  readonly themeColorToColor = {
    paper: "#F7F2E7",
    text: "#2B2118",
    ink: "#2B2118",
  };

  readonly scene = "poster";

  readonly texture = "paper";
}
