import { describe, expect, it } from "vitest";
import { SchemaService } from "@/Services/SchemaService.ts";

describe("SchemaService.sceneJsonSchema()", () => {
  it("describes canvas, objects and text as the top-level fields", () => {
    const schema = SchemaService.sceneJsonSchema() as { properties: Record<string, unknown> };

    expect(Object.keys(schema.properties).slice(0, 4)).toStrictEqual(["version", "canvas", "objects", "text"]);
  });

  it("limits the frame to 4096 px", () => {
    const schema = SchemaService.sceneJsonSchema() as {
      properties: { canvas: { properties: { width: { maximum: number } } } };
    };

    expect(schema.properties.canvas.properties.width.maximum).toBe(4096);
  });
});
