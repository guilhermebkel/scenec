import { BaseTheme } from "@/Resources/Themes/BaseTheme.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export class FlatAutumnTheme extends BaseTheme {
  readonly id = "flat-autumn";

  readonly palette: Theme = {
    skyTop: "#F6E7CF", skyBottom: "#FBEFDD", ground: "#C98B4E", groundDark: "#A86F3A",
    wall: "#F3E3CC", floor: "#D9A86C",
    primary: "#D9643A", secondary: "#3E6E6A", accent: "#F2B134",
    foliage: ["#C8552E", "#E08A2E", "#B8442A"], trunk: "#6B3F26", wood: "#9A5B34", woodDark: "#7A4426",
    ink: "#3A2418", paper: "#FFF8EE", glass: "#BFD9D6", metal: "#7D6B60",
    text: "#3A2418", textOnDark: "#FFF8EE", shadow: "rgba(58,36,24,0.14)",
  };
}
