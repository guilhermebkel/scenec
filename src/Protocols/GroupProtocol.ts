import type { AssetId } from "@/Protocols/AssetProtocol.ts";
import type { SceneObject } from "@/Protocols/SceneProtocol.ts";

export interface GroupPart {
  asset?: AssetId;
  [key: string]: unknown;
}

export interface GroupParams {
  at?: SceneObject["at"];
  color?: string;
  food?: AssetId;
  gap?: number;
  screen?: string;
  person?: GroupPart;
  people?: GroupPart[];
}

// Why: the slug of every group, so code that names a group by id is checked by the compiler.
export const GROUP_IDS = [
  "celebration",
  "conversation",
  "dining",
  "meeting",
  "park_bench",
  "reading_corner",
  "workspace",
] as const;

export type GroupId = (typeof GROUP_IDS)[number];
