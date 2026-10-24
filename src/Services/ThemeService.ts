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


}
