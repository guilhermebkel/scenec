import { BaseTheme } from "@/Resources/Themes/BaseTheme.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export class NightTheme extends BaseTheme {
  readonly id = "night";

  readonly palette: Theme = {
    skyTop: "#141B3A", skyBottom: "#2E3A6E", ground: "#1E2647", groundDark: "#161D38",
    wall: "#2A3360", floor: "#1E2647",
    primary: "#F2C14E", secondary: "#7A86C2", accent: "#FF7A59",
    foliage: ["#2F5A5E", "#38686B", "#26494D"], trunk: "#3A2E3E", wood: "#5A4A63", woodDark: "#43374B",
    ink: "#0E1330", paper: "#F5F1E6", glass: "#FFD97A", metal: "#59618F",
    text: "#F5F1E6", textOnDark: "#F5F1E6", shadow: "rgba(0,0,0,0.25)",
  };
}
