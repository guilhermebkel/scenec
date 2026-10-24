export interface KitOutline {
  w: number;
  inner: number;
}

export interface KitLight {
  strength?: number;
  mode?: string;
  hasCasts?: boolean;
}

export interface KitStyle {
  readonly outline?: KitOutline;
  readonly light?: KitLight;
  readonly texture?: string;
  readonly colors?: Record<string, string>;
  readonly scene?: string;
  readonly hasDrop?: boolean;
}
