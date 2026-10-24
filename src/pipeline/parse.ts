import * as yaml from "js-yaml";
import { z } from "zod";
import type { ZodType } from "zod";
import { canvasSchema, objectSchema, OBJECT_PARAM_KEYS, MAX_OBJECTS, SIZE_NAMES, SLOT_NAMES, sceneSchema, textSchema } from "../protocols/scene.ts";
import type { Scene } from "../protocols/scene.ts";
import { closest } from "../utils/suggest.ts";

export class SceneError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors.join("\n"));
    this.name = "SceneError";
    this.errors = errors;
  }
}

export interface ParsedScene {
  scene: Scene;
  warnings: string[];
}

function shapeKeys(schema: ZodType): string[] {
  return Object.keys((schema as unknown as { shape: Record<string, unknown> }).shape);
}

function unknownKeys(value: unknown, known: readonly string[], where: string): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [];
  }
  return Object.keys(value).filter((key) => !known.includes(key)).map((key) => {
    const [first] = closest(key, known, 1);
    return first
      ? `campo '${key}' desconhecido em ${where}; você quis dizer '${first}'?`
      : `campo '${key}' desconhecido em ${where}; ele será ignorado`;
  });
}

const UNION_FIELD_TO_NAMES: Record<string, readonly string[]> = {
  size: SIZE_NAMES,
  at: SLOT_NAMES,
  frame: ["left", "center", "right"],
};

const OBJECT_KEYS = [...shapeKeys(objectSchema), ...OBJECT_PARAM_KEYS];

function checkKnownKeys(scene: Scene): string[] {
  const warnings = unknownKeys(scene.canvas, shapeKeys(canvasSchema), "canvas");
  for (const [id, object] of Object.entries(scene.objects ?? {})) {
    warnings.push(...unknownKeys(object, OBJECT_KEYS, `objects.${id}`));
  }
  (scene.text ?? []).forEach((text, index) => {
    warnings.push(...unknownKeys(text, shapeKeys(textSchema), `text[${index}]`));
  });
  return warnings;
}

function valueAt(root: unknown, path: PropertyKey[]): unknown {
  let current: unknown = root;
  for (const key of path) {
    current = typeof current === "object" && current !== null ? (current as Record<PropertyKey, unknown>)[key] : undefined;
  }
  return current;
}

function describeIssue(path: PropertyKey[], message: string, values?: readonly unknown[], received?: unknown): string {
  const where = path.length ? path.map(String).join(".") : "(cena)";
  const options = values?.map(String) ?? [];
  const [suggestion] = typeof received === "string" ? closest(received, options, 1) : [];
  const hint = suggestion ? `; você quis dizer '${suggestion}'?` : options.length ? `; valores aceitos: ${options.join(", ")}` : "";
  return `${where}: ${message}${hint}`;
}

export function parseScene(input: unknown): ParsedScene {
  let raw: unknown = input;
  if (typeof input === "string") {
    try {
      raw = yaml.load(input);
    } catch (error) {
      throw new SceneError([`YAML inválido: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }
  const result = sceneSchema.safeParse(raw, { error: z.locales.pt().localeError });
  if (!result.success) {
    throw new SceneError(result.error.issues.map((issue) => {
      const field = String(issue.path.at(-1));
      const values = issue.code === "invalid_union" ? UNION_FIELD_TO_NAMES[field] : "values" in issue ? issue.values as unknown[] : undefined;
      return describeIssue(issue.path, issue.message, values, valueAt(raw, issue.path));
    }));
  }
  const count = Object.keys(result.data.objects ?? {}).length;
  if (count > MAX_OBJECTS) {
    throw new SceneError([`objects: ${count} objetos; o limite é ${MAX_OBJECTS}`]);
  }
  return { scene: result.data, warnings: checkKnownKeys(result.data) };
}
