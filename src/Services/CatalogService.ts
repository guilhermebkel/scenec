import { GroupService } from "@/Services/GroupService.ts";
import { THEME_IDS, type ThemeId } from "@/Protocols/ThemeProtocol.ts";
import type { AssetKind } from "@/Protocols/AssetProtocol.ts";
import { PersonUtil } from "@/Utils/PersonUtil.ts";
import { KitService } from "@/Services/KitService.ts";
import { AssetService } from "@/Services/AssetService.ts";
import { DEPTH_NAMES, SETTING_NAMES, SHOT_NAMES, SIZE_NAMES, SLOT_NAMES } from "@/Protocols/SceneProtocol.ts";
export type CatalogKind = typeof CatalogService.CATALOG_KINDS[number];

export interface AssetEntry {
  id: string;
  kind: AssetKind;
  width: number;
  height: number;
  synonyms: string[];
}
type PartIdToAsset = Record<string, string>;

export interface GroupEntry {
  id: string;
  description: string;
  parts: PartIdToAsset;
}

export class CatalogService {
  static readonly CATALOG_KINDS = ["assets", "groups", "kits", "themes", "poses", "layout"] as const;

  static listAssets(): AssetEntry[] {
    return Object.entries(AssetService.ASSET_ID_TO_ASSET).map(([id, asset]) => ({
      id, kind: asset.kind, width: asset.width, height: asset.height, synonyms: [...asset.tags],
    }));
  }

  static listGroups(): GroupEntry[] {
    return Object.entries(GroupService.GROUP_ID_TO_GROUP).map(([id, group]) => {
      const built = group.build({ at: 0.5 }) as Record<string, { asset: string }>;
      const parts = Object.fromEntries(Object.entries(built).map(([part, def]) => [part, def.asset]));
      return { id, description: group.desc, parts };
    });
  }

  static listKits(): { id: string; description: string }[] {
    return Object.entries(KitService.KIT_ID_TO_KIT).map(([id, kit]) => ({ id, description: kit.description }));
  }

  static listThemes(): ThemeId[] {
    return [...THEME_IDS];
  }

  private static readonly KIND_TO_LISTING: Record<CatalogKind, () => unknown> = {
    assets: () => CatalogService.listAssets(),
    groups: () => CatalogService.listGroups(),
    kits: () => CatalogService.listKits(),
    themes: () => CatalogService.listThemes(),
    poses: () => ({ ...PersonUtil.POSE_NAMES, expressions: PersonUtil.EXPRESSION_NAMES }),
    layout: () => ({
      slots: SLOT_NAMES, sizes: SIZE_NAMES, depths: DEPTH_NAMES, settings: SETTING_NAMES, shots: SHOT_NAMES,
    }),
  };

  static catalog(kind: CatalogKind): unknown {
    return CatalogService.KIND_TO_LISTING[kind]();
  }
}
