import { ASSETS } from "./drawing/assets.ts";
import { KITS } from "./drawing/kits.ts";
import { EXPRESSION_NAMES, POSE_NAMES } from "./drawing/person.ts";
import { THEMES } from "./drawing/themes.ts";
import { GROUPS } from "./pipeline/groups.ts";
import { DEPTH_NAMES, SETTING_NAMES, SHOT_NAMES, SIZE_NAMES, SLOT_NAMES } from "./protocols/scene.ts";

export const CATALOG_KINDS = ["assets", "groups", "kits", "themes", "poses", "layout"] as const;
export type CatalogKind = typeof CATALOG_KINDS[number];

export interface AssetEntry {
  id: string;
  kind: string;
  width: number;
  height: number;
  synonyms: string[];
}

export function listAssets(): AssetEntry[] {
  return Object.entries(ASSETS).map(([id, asset]) => ({
    id, kind: asset.kind as string, width: asset.w as number, height: asset.h as number, synonyms: (asset.tags ?? []) as string[],
  }));
}

export function listGroups(): { id: string; description: string; parts: Record<string, string> }[] {
  return Object.entries(GROUPS).map(([id, group]) => {
    const built = group.build({ at: 0.5 }) as Record<string, { asset: string }>;
    const parts = Object.fromEntries(Object.entries(built).map(([part, def]) => [part, def.asset]));
    return { id, description: group.desc as string, parts };
  });
}

export function listKits(): { id: string; description: string }[] {
  return Object.entries(KITS).map(([id, kit]) => ({ id, description: kit.desc as string }));
}

export function listThemes(): string[] {
  return Object.keys(THEMES);
}

export function catalog(kind: CatalogKind): unknown {
  switch (kind) {
    case "assets": return listAssets();
    case "groups": return listGroups();
    case "kits": return listKits();
    case "themes": return listThemes();
    case "poses": return { ...POSE_NAMES, expressions: EXPRESSION_NAMES };
    case "layout": return { slots: SLOT_NAMES, sizes: SIZE_NAMES, depths: DEPTH_NAMES, settings: SETTING_NAMES, shots: SHOT_NAMES };
  }
}
