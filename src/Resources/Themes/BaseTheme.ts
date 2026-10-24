import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export abstract class BaseTheme {
  abstract readonly id: string;

  abstract readonly palette: Theme;
}
