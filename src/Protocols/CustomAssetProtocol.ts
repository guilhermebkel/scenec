export interface CustomAssetDefinition {
  kind?: string;
  svg?: string;
  image?: string;
  height?: number;
  top?: number;
  seat?: number;
  elevation?: number;
  tags?: string[];
  recolor?: boolean | number;
  facing?: string;
  shadow?: boolean;
  trim?: boolean;
  size_px?: number[];
}

export interface CustomArtwork {
  inner: string;
  box: { x: number; y: number; width: number; height: number };
}
