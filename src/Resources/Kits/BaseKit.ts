export abstract class BaseKit {
  abstract readonly id: string;

  abstract readonly desc: string;

  readonly outline?: { w: number; inner: number };

  readonly light?: { strength?: number; mode?: string; casts?: boolean };

  readonly texture?: string;

  readonly colors?: Record<string, string>;

  readonly scene?: string;

  readonly drop?: boolean;
}
