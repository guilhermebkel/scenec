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
