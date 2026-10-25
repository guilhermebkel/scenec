import type { Theme, ThemeId } from "@/Protocols/ThemeProtocol.ts";

export abstract class BaseTheme {
  abstract readonly id: ThemeId;

  abstract readonly palette: Theme;
}
