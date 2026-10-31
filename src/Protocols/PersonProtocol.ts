export type Point = [number, number];

export interface PersonParams {
  age?: string;
  build?: string;
  body?: string;
  detail?: string;
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

export const AGE_NAMES = ["child", "teen", "adult", "elder"] as const;
export const BUILD_NAMES = ["slim", "average", "broad", "heavy"] as const;
export const BODY_NAMES = ["chibi", "standard", "long"] as const;
export const SKIN_NAMES = ["light", "medium", "tan", "dark", "deep"] as const;
export const HAIR_COLOR_NAMES = ["black", "brown", "blonde", "red", "gray"] as const;
export const HAIR_STYLE_NAMES = ["long", "bun", "curly", "ponytail", "short", "bald"] as const;
export const EXPRESSION_NAMES = ["happy", "neutral", "surprised", "sad", "worried", "angry", "laughing", "wink", "thinking"] as const;
export const STANDING_POSE_NAMES = [
  "standing", "waving", "pointing", "presenting", "celebrating", "holding", "hands_on_hips", "thinking", "shrugging", "walking", "phone",
] as const;
export const SEATED_POSE_NAMES = ["sitting", "typing", "reading", "drinking"] as const;
export const GAZE_NAMES = ["left", "right", "up", "down", "up-left", "up-right", "down-left", "down-right", "camera", "forward"] as const;
export const BEND_NAMES = ["down", "out"] as const;
export const HAT_NAMES = ["grad_cap", "cap"] as const;
export const OUTFIT_NAMES = ["tshirt", "sweater", "labcoat", "gown", "dress"] as const;
export const BOTTOM_NAMES = ["pants", "shorts", "skirt", "dress"] as const;

export type AgeName = (typeof AGE_NAMES)[number];
export type BuildName = (typeof BUILD_NAMES)[number];
export type BodyName = (typeof BODY_NAMES)[number];
export type SkinName = (typeof SKIN_NAMES)[number];
export type HairColorName = (typeof HAIR_COLOR_NAMES)[number];
export type HairStyleName = (typeof HAIR_STYLE_NAMES)[number];
export type ExpressionName = (typeof EXPRESSION_NAMES)[number];
export type StandingPoseName = (typeof STANDING_POSE_NAMES)[number];
export type SeatedPoseName = (typeof SEATED_POSE_NAMES)[number];
export type GazeName = (typeof GAZE_NAMES)[number];
export type BendName = (typeof BEND_NAMES)[number];
export type HatName = (typeof HAT_NAMES)[number];
export type OutfitName = (typeof OUTFIT_NAMES)[number];
export type BottomName = (typeof BOTTOM_NAMES)[number];
