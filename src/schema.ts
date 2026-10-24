import { z } from "zod";
import { sceneSchema } from "./protocols/scene.ts";

export { catalog, CATALOG_KINDS, listAssets, listGroups, listKits, listThemes } from "./catalog.ts";
export type { AssetEntry, CatalogKind } from "./catalog.ts";

export function sceneJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(sceneSchema, { target: "draft-2020-12" });
}
