import { FlatAutumnTheme } from "@/Resources/Themes/FlatAutumnTheme.ts";
import { FlatCoolTheme } from "@/Resources/Themes/FlatCoolTheme.ts";
import { NightTheme } from "@/Resources/Themes/NightTheme.ts";
import { WarmCafeTheme } from "@/Resources/Themes/WarmCafeTheme.ts";
import { BeachTheme } from "@/Resources/Themes/BeachTheme.ts";
import type { Theme, ThemeId } from "@/Protocols/ThemeProtocol.ts";
import { RegistryUtil } from "@/Utils/RegistryUtil.ts";
export class ThemeService {
  static readonly THEME_ID_TO_THEME: Record<ThemeId, Theme> = RegistryUtil.indexValues(
    [new FlatAutumnTheme(), new FlatCoolTheme(), new NightTheme(), new WarmCafeTheme(), new BeachTheme()],
    (theme) => theme.palette,
  );

  static resolve(id: ThemeId): Theme {
    return ThemeService.THEME_ID_TO_THEME[id];
  }
}
