import { BaseTheme } from "@/Resources/Themes/BaseTheme.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export class BeachTheme extends BaseTheme {
  readonly id = "beach";

  readonly palette: Theme = {
    skyTop: "#7FD0E8", skyBottom: "#D6F1F7", ground: "#F1D49B", groundDark: "#E2BF7E",
    wall: "#FFF", floor: "#F1D49B", sea: "#2FA5C4", seaLight: "#5BC2DA",
    primary: "#F0644B", secondary: "#126E86", accent: "#FFC845",
    foliage: ["#2E9E6B", "#3DB37A", "#24855A"], trunk: "#9A6A3F", wood: "#B07A48", woodDark: "#8A5A32",
    ink: "#0F3A47", paper: "#FFFFFF", glass: "#CFEFF7", metal: "#6D8790",
    text: "#0F3A47", textOnDark: "#FFFFFF", shadow: "rgba(15,58,71,0.15)",
  };
}
