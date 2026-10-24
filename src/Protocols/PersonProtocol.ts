export type Point = [number, number];

export interface PersonParams {
  age?: string;
  build?: string;
  height?: number | string;
  skin?: string;
  hair?: string;
  hair_color?: string;
  expr?: string;
  glasses?: boolean;
  beard?: boolean;
  shirt?: string;
  pants?: string;
  jacket?: string;
  outfit?: string;
  bottom?: string;
  shoes?: string;
  pose?: string;
  facing?: string;
  view?: string;
  gown?: string;
  stole?: string;
  backpack?: boolean | string;
  hat?: string;
  hat_color?: string;
  cane?: boolean;
  gaze?: number[];
  look?: string;
}

export interface BodyScale {
  bx: number;
  by: number;
  hs: number;
}

export interface Arm {
  elbow: Point;
  hand: Point;
}
