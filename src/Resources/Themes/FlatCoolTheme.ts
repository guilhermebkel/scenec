import { BaseTheme } from "@/Resources/Themes/BaseTheme.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export class FlatCoolTheme extends BaseTheme {
  readonly id = "flat-cool";

  readonly palette: Theme = {
    skyTop: "#DCEBF7", skyBottom: "#EEF5FB", ground: "#8CC08A", groundDark: "#6FA56E",
    wall: "#E9EEF4", floor: "#B8C4D1",
    primary: "#3A6FD8", secondary: "#25344F", accent: "#F5A524",
    foliage: ["#4E9E5C", "#6BB36A", "#3D8550"], trunk: "#6E5444", wood: "#B98A5E", woodDark: "#8E6542",
    ink: "#1F2A3D", paper: "#FFFFFF", glass: "#BCD7F2", metal: "#8592A6",
    text: "#1F2A3D", textOnDark: "#FFFFFF", shadow: "rgba(31,42,61,0.13)",
  };
}
