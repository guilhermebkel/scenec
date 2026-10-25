import { IdUtil } from "@/Utils/IdUtil.ts";
import { SuggestUtil } from "@/Utils/SuggestUtil.ts";
import * as yaml from "js-yaml";
import { z } from "zod";
import type { ZodType } from "zod";
import { canvasSchema, objectSchema, OBJECT_PARAM_KEYS, MAX_OBJECTS, SIZE_NAMES, SLOT_NAMES, sceneSchema, textSchema } from "@/Protocols/SceneProtocol.ts";
import type { Scene } from "@/Protocols/SceneProtocol.ts";
import { SceneError } from "@/Errors/SceneError.ts";

export interface ParsedScene {
  scene: Scene;
  warnings: string[];
}
type UnionField = "size" | "at" | "frame";

export class ParsingModule {
  private static shapeKeys(schema: ZodType): string[] {
    return Object.keys((schema as unknown as { shape: Record<string, unknown> }).shape);
  }

  private static unknownKeys(value: unknown, known: readonly string[], where: string): string[] {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return [];
    }
    return Object.keys(value).filter((key) => !known.includes(key)).map((key) => {
      const [first] = SuggestUtil.closest(key, known, 1);
      return first
        ? `unknown field '${key}' in ${where}; did you mean '${first}'?`
        : `unknown field '${key}' in ${where}; it will be ignored`;
    });
  }

  private static readonly UNION_FIELD_TO_NAMES: Record<UnionField, readonly string[]> = {
    size: SIZE_NAMES,
    at: SLOT_NAMES,
    frame: ["left", "center", "right"],
  };

  private static readonly OBJECT_KEYS = [...ParsingModule.shapeKeys(objectSchema), ...OBJECT_PARAM_KEYS];

  private static checkKnownKeys(scene: Scene): string[] {
    const warnings = ParsingModule.unknownKeys(scene.canvas, ParsingModule.shapeKeys(canvasSchema), "canvas");
    for (const [id, object] of Object.entries(scene.objects ?? {})) {
      warnings.push(...ParsingModule.unknownKeys(object, ParsingModule.OBJECT_KEYS, `objects.${id}`));
    }
    (scene.text ?? []).forEach((text, index) => {
      warnings.push(...ParsingModule.unknownKeys(text, ParsingModule.shapeKeys(textSchema), `text[${index}]`));
    });
    return warnings;
  }

  private static valueAt(root: unknown, path: PropertyKey[]): unknown {
    let current: unknown = root;
    for (const key of path) {
      const isObject = typeof current === "object" && current !== null;
      current = isObject ? (current as Record<PropertyKey, unknown>)[key] : undefined;
    }
    return current;
  }

  private static hintFor(suggestion: string | undefined, options: readonly string[]): string {
    if (suggestion) {
      return `; did you mean '${suggestion}'?`;
    }
    return options.length ? `; accepted values: ${options.join(", ")}` : "";
  }

  private static describeIssue(
    path: PropertyKey[], message: string, values?: readonly unknown[], received?: unknown,
  ): string {
    const where = path.length ? path.map(String).join(".") : "(scene)";
    const options = values?.map(String) ?? [];
    const [suggestion] = typeof received === "string" ? SuggestUtil.closest(received, options, 1) : [];
    return `${where}: ${message}${ParsingModule.hintFor(suggestion, options)}`;
  }

  private static valuesOf(issue: z.core.$ZodIssue): readonly unknown[] | undefined {
    if (issue.code === "invalid_union") {
      const field = String(issue.path.at(-1));
      return IdUtil.lookup(ParsingModule.UNION_FIELD_TO_NAMES, field);
    }
    return "values" in issue ? issue.values : undefined;
  }

  static parseScene(input: unknown): ParsedScene {
    let raw: unknown = input;
    if (typeof input === "string") {
      try {
        raw = yaml.load(input);
      } catch (error) {
        throw new SceneError([`invalid YAML: ${error instanceof Error ? error.message : String(error)}`]);
      }
    }
    const result = sceneSchema.safeParse(raw, { error: z.locales.en().localeError });
    if (!result.success) {
      throw new SceneError(result.error.issues.map((issue) => {
        const values = ParsingModule.valuesOf(issue);
        return ParsingModule.describeIssue(issue.path, issue.message, values, ParsingModule.valueAt(raw, issue.path));
      }));
    }
    const count = Object.keys(result.data.objects ?? {}).length;
    if (count > MAX_OBJECTS) {
      throw new SceneError([`objects: ${count} objects; the limit is ${MAX_OBJECTS}`]);
    }
    return { scene: result.data, warnings: ParsingModule.checkKnownKeys(result.data) };
  }
}
