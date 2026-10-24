import type { ThemeColorName } from "@/Protocols/ThemeProtocol.ts";
export interface KitOutline {
  w: number;
  inner: number;
}

export interface KitLight {
  strength?: number;
  mode?: string;
  hasCasts?: boolean;
}

export interface KitStyle {
  readonly outline?: KitOutline;
  readonly light?: KitLight;
  readonly texture?: string;
  readonly colors?: Partial<Record<ThemeColorName, string>>;
  readonly scene?: string;
  readonly hasDrop?: boolean;
}

// Why: the slug of every kit, so code that names a kit by id is checked by the compiler.
export const KIT_IDS = [
  "flat",
  "hatch",
  "outline",
  "paper",
  "riso",
  "sketch",
] as const;

export type KitId = (typeof KIT_IDS)[number];
