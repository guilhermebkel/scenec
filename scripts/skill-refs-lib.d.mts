export interface CatalogInput {
  assets: { id: string; kind: string; width: number; height: number; synonyms: string[] }[];
  groups: { id: string; description: string; parts: object }[];
  kits: { id: string; description: string }[];
  themes: string[];
  poses: unknown;
}

export function buildDsl(schema: Record<string, unknown>, layout: unknown): string;
export function buildCatalog(input: CatalogInput): string;
