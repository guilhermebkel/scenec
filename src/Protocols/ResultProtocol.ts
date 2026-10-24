export interface LayoutEntry {
  id: string;
  asset: string;
  x: number;
  base: number;
  w: number;
  h: number;
}

export interface CompileResult {
  svg: string;
  warnings: string[];
  description: string;
  layout?: LayoutEntry[];
}
