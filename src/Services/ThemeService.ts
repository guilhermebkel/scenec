import type { Theme } from "@/Protocols/ThemeProtocol.ts";
export class ThemeService {
  // Temas: paletas aplicadas a todos os assets via "slots" de cor.
  static readonly THEMES: Record<string, Theme> = {
    "flat-autumn": {
      skyTop: "#F6E7CF", skyBottom: "#FBEFDD", ground: "#C98B4E", groundDark: "#A86F3A",
      wall: "#F3E3CC", floor: "#D9A86C",
      primary: "#D9643A", secondary: "#3E6E6A", accent: "#F2B134",
      foliage: ["#C8552E", "#E08A2E", "#B8442A"], trunk: "#6B3F26", wood: "#9A5B34", woodDark: "#7A4426",
      ink: "#3A2418", paper: "#FFF8EE", glass: "#BFD9D6", metal: "#7D6B60",
      text: "#3A2418", textOnDark: "#FFF8EE", shadow: "rgba(58,36,24,0.14)",
    },
    "flat-cool": {
      skyTop: "#DCEBF7", skyBottom: "#EEF5FB", ground: "#8CC08A", groundDark: "#6FA56E",
      wall: "#E9EEF4", floor: "#B8C4D1",
      primary: "#3A6FD8", secondary: "#25344F", accent: "#F5A524",
      foliage: ["#4E9E5C", "#6BB36A", "#3D8550"], trunk: "#6E5444", wood: "#B98A5E", woodDark: "#8E6542",
      ink: "#1F2A3D", paper: "#FFFFFF", glass: "#BCD7F2", metal: "#8592A6",
      text: "#1F2A3D", textOnDark: "#FFFFFF", shadow: "rgba(31,42,61,0.13)",
    },
    "night": {
      skyTop: "#141B3A", skyBottom: "#2E3A6E", ground: "#1E2647", groundDark: "#161D38",
      wall: "#2A3360", floor: "#1E2647",
      primary: "#F2C14E", secondary: "#7A86C2", accent: "#FF7A59",
      foliage: ["#2F5A5E", "#38686B", "#26494D"], trunk: "#3A2E3E", wood: "#5A4A63", woodDark: "#43374B",
      ink: "#0E1330", paper: "#F5F1E6", glass: "#FFD97A", metal: "#59618F",
      text: "#F5F1E6", textOnDark: "#F5F1E6", shadow: "rgba(0,0,0,0.25)",
    },
    "warm-cafe": {
      skyTop: "#F4E1D2", skyBottom: "#F4E1D2", ground: "#8C5A3C", groundDark: "#6E452E",
      wall: "#EAD2BE", floor: "#9C6844",
      primary: "#B5482E", secondary: "#2F4A3E", accent: "#E8A93B",
      foliage: ["#4F7A4A", "#628F57", "#3F6640"], trunk: "#5A3B28", wood: "#7A4A2E", woodDark: "#5C3620",
      ink: "#2B1A12", paper: "#FFF6EC", glass: "#F6E2B8", metal: "#3A2B24",
      text: "#2B1A12", textOnDark: "#FFF6EC", shadow: "rgba(43,26,18,0.16)",
    },
    "beach": {
      skyTop: "#7FD0E8", skyBottom: "#D6F1F7", ground: "#F1D49B", groundDark: "#E2BF7E",
      wall: "#FFF", floor: "#F1D49B", sea: "#2FA5C4", seaLight: "#5BC2DA",
      primary: "#F0644B", secondary: "#126E86", accent: "#FFC845",
      foliage: ["#2E9E6B", "#3DB37A", "#24855A"], trunk: "#9A6A3F", wood: "#B07A48", woodDark: "#8A5A32",
      ink: "#0F3A47", paper: "#FFFFFF", glass: "#CFEFF7", metal: "#6D8790",
      text: "#0F3A47", textOnDark: "#FFFFFF", shadow: "rgba(15,58,71,0.15)",
    },
  };

  static readonly SKIN: Record<string, string> = { light: "#F2C9A5", medium: "#D19A6E", tan: "#B87A50", dark: "#7A4B30", deep: "#5A3522" };

  static readonly HAIR: Record<string, string> = { black: "#1E1A1A", brown: "#5A3825", blonde: "#E2B45A", red: "#B0462A", gray: "#9C9C9C" };
}
