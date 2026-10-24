export interface FileReader {
  readText: (file: string) => string;
  readBytes: (file: string) => Uint8Array;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompileOptions {
  files?: FileReader;
  measure?: (svg: string) => BBox | null;
}
