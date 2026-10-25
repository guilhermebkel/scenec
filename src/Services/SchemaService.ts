import { z } from "zod";
import { sceneSchema } from "@/Protocols/SceneProtocol.ts";

export class SchemaService {
  static sceneJsonSchema(): Record<string, unknown> {
    return z.toJSONSchema(sceneSchema, { target: "draft-2020-12" });
  }
}
