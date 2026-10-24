// Why: the theme fields that hold a single color string, so kits and scenes can override them by a checked name.
export const THEME_COLOR_NAMES = [
  "skyTop", "skyBottom", "ground", "groundDark", "wall", "floor", "sea", "seaLight", "primary", "secondary", "accent",
  "trunk", "wood", "woodDark", "ink", "paper", "glass", "metal", "text", "textOnDark", "shadow",
] as const;

export type ThemeColorName = (typeof THEME_COLOR_NAMES)[number];

export interface Theme {
  skyTop: string;
  skyBottom: string;
  ground: string;
  groundDark: string;
  wall: string;
  floor: string;
  sea?: string;
  seaLight?: string;
  primary: string;
  secondary: string;
  accent: string;
  foliage: [string, string, string];
  trunk: string;
  wood: string;
  woodDark: string;
  ink: string;
  paper: string;
  glass: string;
  metal: string;
  text: string;
  textOnDark: string;
  shadow: string;
  [key: string]: string | string[] | undefined;
}

// Why: the slug of every theme, in the order the catalog lists them, so code that names a theme by id is checked by the compiler.
export const THEME_IDS = ["flat-autumn", "flat-cool", "night", "warm-cafe", "beach"] as const;

export type ThemeId = (typeof THEME_IDS)[number];
