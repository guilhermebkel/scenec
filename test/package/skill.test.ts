import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as yaml from "js-yaml";
import { check } from "../../src/render.ts";
import * as schema from "../../src/schema.ts";
import { buildCatalog, buildDsl } from "../../scripts/skill-refs-lib.mjs";

const SKILL_DIR = new URL("../../skills/draw-scene/", import.meta.url);
const read = (path: string): string => readFileSync(new URL(path, SKILL_DIR), "utf8");
type FrontmatterKey = "name" | "description" | "license" | "compatibility" | "allowed-tools" | "metadata";

const ALLOWED_FRONTMATTER_KEYS: readonly string[] & readonly FrontmatterKey[] = ["name", "description", "license", "compatibility", "allowed-tools", "metadata"];

function frontmatterOf(markdown: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  return yaml.load(match?.[1] ?? "") as Record<string, unknown>;
}

describe("skill", () => {
  it("has a frontmatter with only the allowed keys", () => {
    const frontmatter = frontmatterOf(read("SKILL.md"));

    expect(Object.keys(frontmatter).every((key) => ALLOWED_FRONTMATTER_KEYS.includes(key))).toBe(true);
    expect(frontmatter.name).toBe("draw-scene");
  });

  it("keeps the generated references up to date", () => {
    const dsl = buildDsl(schema.sceneJsonSchema(), schema.catalog("layout"));
    const catalogMd = buildCatalog({
      assets: schema.listAssets(), groups: schema.listGroups(), kits: schema.listKits(),
      themes: schema.listThemes(), poses: schema.catalog("poses"),
    });

    expect(read("references/dsl.md")).toBe(dsl);
    expect(read("references/catalog.md")).toBe(catalogMd);
  });

  const recipes = readdirSync(new URL("recipes/", SKILL_DIR));
  it.each(recipes)("recipe %s compiles with no warning and no critique", (file) => {
    const report = check(read(`recipes/${file}`), {});

    expect({ warnings: report.warnings, art: report.art }).toStrictEqual({ warnings: [], art: [] });
  });
});
