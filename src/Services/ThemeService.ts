import { FlatAutumnTheme } from "@/Resources/Themes/FlatAutumnTheme.ts";
import { FlatCoolTheme } from "@/Resources/Themes/FlatCoolTheme.ts";
import { NightTheme } from "@/Resources/Themes/NightTheme.ts";
import { WarmCafeTheme } from "@/Resources/Themes/WarmCafeTheme.ts";
import { BeachTheme } from "@/Resources/Themes/BeachTheme.ts";
import type { Theme, ThemeId } from "@/Protocols/ThemeProtocol.ts";
import { RegistryUtil } from "@/Utils/RegistryUtil.ts";
export class ThemeService {
  static readonly THEMES: Record<ThemeId, Theme> = RegistryUtil.indexValues(
    [new FlatAutumnTheme(), new FlatCoolTheme(), new NightTheme(), new WarmCafeTheme(), new BeachTheme()],
    (theme) => theme.palette,
  );
}
