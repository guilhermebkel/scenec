import type { KitLight } from "@/Protocols/KitProtocol.ts";
import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class DuotoneKit extends BaseKit {
  readonly id = "duotone";

  readonly description = "duotone: two inks mapped across luminance with halftone";

  readonly light: KitLight = { mode: "none" };

  readonly themeColorToColor = {
    primary: "#1D2D50",
    paper: "#F4EBD9",
    accent: "#133B5C",
    secondary: "#1E5F74",
    text: "#1D2D50",
    ink: "#1D2D50",
  };

  readonly scene = "duotone";
}
