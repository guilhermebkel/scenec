import { FlatAutumnTheme } from "@/Resources/Themes/FlatAutumnTheme.ts";
import { FlatCoolTheme } from "@/Resources/Themes/FlatCoolTheme.ts";
import { NightTheme } from "@/Resources/Themes/NightTheme.ts";
import { WarmCafeTheme } from "@/Resources/Themes/WarmCafeTheme.ts";
import { BeachTheme } from "@/Resources/Themes/BeachTheme.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
export class ThemeService {
  // Temas: paletas aplicadas a todos os assets via "slots" de cor.
  static readonly THEMES: Record<string, Theme> = Object.fromEntries(
    [new FlatAutumnTheme(), new FlatCoolTheme(), new NightTheme(), new WarmCafeTheme(), new BeachTheme()].map((theme) => [theme.id, theme.palette]),
  );

  static readonly SKIN: Record<string, string> = { light: "#F2C9A5", medium: "#D19A6E", tan: "#B87A50", dark: "#7A4B30", deep: "#5A3522" };

  static readonly HAIR: Record<string, string> = { black: "#1E1A1A", brown: "#5A3825", blonde: "#E2B45A", red: "#B0462A", gray: "#9C9C9C" };
}
