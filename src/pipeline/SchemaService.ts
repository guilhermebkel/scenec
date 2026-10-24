import { z } from "zod";
import { sceneSchema } from "@/protocols/scene.ts";

export class SchemaService {
  static sceneJsonSchema(): Record<string, unknown> {
    return z.toJSONSchema(sceneSchema, { target: "draft-2020-12" });
  }
}
