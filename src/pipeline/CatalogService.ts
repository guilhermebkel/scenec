import { GroupService } from "@/pipeline/GroupService.ts";
import { ThemeUtil } from "@/drawing/ThemeUtil.ts";
import { PersonUtil } from "@/drawing/PersonUtil.ts";
import { KitUtil } from "@/drawing/KitUtil.ts";
import { AssetUtil } from "@/drawing/AssetUtil.ts";
import { DEPTH_NAMES, SETTING_NAMES, SHOT_NAMES, SIZE_NAMES, SLOT_NAMES } from "@/protocols/scene.ts";
export type CatalogKind = typeof CatalogService.CATALOG_KINDS[number];

export interface AssetEntry {
  id: string;
  kind: string;
  width: number;
  height: number;
  synonyms: string[];
}
export class CatalogService {
  static readonly CATALOG_KINDS = ["assets", "groups", "kits", "themes", "poses", "layout"] as const;

  static listAssets(): AssetEntry[] {
    return Object.entries(AssetUtil.ASSETS).map(([id, asset]) => ({
      id, kind: asset.kind as string, width: asset.w as number, height: asset.h as number, synonyms: (asset.tags ?? []) as string[],
    }));
  }

  static listGroups(): { id: string; description: string; parts: Record<string, string> }[] {
    return Object.entries(GroupService.GROUPS).map(([id, group]) => {
      const built = group.build({ at: 0.5 }) as Record<string, { asset: string }>;
      const parts = Object.fromEntries(Object.entries(built).map(([part, def]) => [part, def.asset]));
      return { id, description: group.desc as string, parts };
    });
  }

  static listKits(): { id: string; description: string }[] {
    return Object.entries(KitUtil.KITS).map(([id, kit]) => ({ id, description: kit.desc as string }));
  }

  static listThemes(): string[] {
    return Object.keys(ThemeUtil.THEMES);
  }

  static catalog(kind: CatalogKind): unknown {
    switch (kind) {
      case "assets": return CatalogService.listAssets();
      case "groups": return CatalogService.listGroups();
      case "kits": return CatalogService.listKits();
      case "themes": return CatalogService.listThemes();
      case "poses": return { ...PersonUtil.POSE_NAMES, expressions: PersonUtil.EXPRESSION_NAMES };
      case "layout": return { slots: SLOT_NAMES, sizes: SIZE_NAMES, depths: DEPTH_NAMES, settings: SETTING_NAMES, shots: SHOT_NAMES };
    }
  }
}
