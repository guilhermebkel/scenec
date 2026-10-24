import { BaseTheme } from "@/Resources/Themes/BaseTheme.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export class WarmCafeTheme extends BaseTheme {
  readonly id = "warm-cafe";

  readonly palette: Theme = {
    skyTop: "#F4E1D2", skyBottom: "#F4E1D2", ground: "#8C5A3C", groundDark: "#6E452E",
    wall: "#EAD2BE", floor: "#9C6844",
    primary: "#B5482E", secondary: "#2F4A3E", accent: "#E8A93B",
    foliage: ["#4F7A4A", "#628F57", "#3F6640"], trunk: "#5A3B28", wood: "#7A4A2E", woodDark: "#5C3620",
    ink: "#2B1A12", paper: "#FFF6EC", glass: "#F6E2B8", metal: "#3A2B24",
    text: "#2B1A12", textOnDark: "#FFF6EC", shadow: "rgba(43,26,18,0.16)",
  };
}
