import { CatalogService } from "@/Services/CatalogService.ts";
import type { AssetEntry, CatalogKind } from "@/Services/CatalogService.ts";
import { SchemaService } from "@/Services/SchemaService.ts";

export type { AssetEntry, CatalogKind };

export const CATALOG_KINDS = CatalogService.CATALOG_KINDS;

export function catalog(kind: CatalogKind): unknown {
  return CatalogService.catalog(kind);
}

export function listAssets(): AssetEntry[] {
  return CatalogService.listAssets();
}

export function listGroups(): ReturnType<typeof CatalogService.listGroups> {
  return CatalogService.listGroups();
}

export function listKits(): ReturnType<typeof CatalogService.listKits> {
  return CatalogService.listKits();
}

export function listThemes(): string[] {
  return CatalogService.listThemes();
}

export function sceneJsonSchema(): Record<string, unknown> {
  return SchemaService.sceneJsonSchema();
}
