import { mkdirSync, writeFileSync } from "node:fs";
import { buildCatalog, buildDsl } from "./skill-refs-lib.mjs";
import * as api from "../dist/schema.js";

const REFERENCES_DIR = new URL("../skills/scenec/references/", import.meta.url);
mkdirSync(REFERENCES_DIR, { recursive: true });
const dsl = buildDsl(api.sceneJsonSchema(), api.catalog("layout"));
const catalogMd = buildCatalog({
  assets: api.listAssets(), groups: api.listGroups(), kits: api.listKits(), themes: api.listThemes(), poses: api.catalog("poses"),
});
writeFileSync(new URL("dsl.md", REFERENCES_DIR), dsl);
writeFileSync(new URL("catalog.md", REFERENCES_DIR), catalogMd);
process.stdout.write("skill references written\n");
