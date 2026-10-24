import type { SceneObject } from "@/Protocols/SceneProtocol.ts";

export type GroupPart = Record<string, unknown>;

export interface GroupParams {
  at?: SceneObject["at"];
  color?: string;
  food?: string;
  gap?: number;
  screen?: string;
  person?: GroupPart;
  people?: GroupPart[];
}
