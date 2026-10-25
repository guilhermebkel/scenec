import { z } from "zod";

export const SLOT_NAMES = ["far-left", "left", "center-left", "center", "center-right", "right", "far-right"] as const;
export const SIZE_NAMES = ["tiny", "small", "medium", "large", "huge"] as const;
export const DEPTH_NAMES = ["far", "mid", "near"] as const;
export const MODE_NAMES = ["classic", "2.5d", "board", "map"] as const;

export type ModeName = (typeof MODE_NAMES)[number];
export const SETTING_NAMES = ["outdoor", "indoor", "beach", "city"] as const;
export const SHOT_NAMES = ["wide", "full", "medium", "close"] as const;
export const MAX_OBJECTS = 200;
export const MAX_CANVAS_PX = 4096;

const slot = z.union([
  z.number(),
  z.enum([...SLOT_NAMES, ...SLOT_NAMES.map((name) => `top-${name}` as const), ...SLOT_NAMES.map((name) => `sky-${name}` as const)]),
  z.tuple([z.number(), z.number()]),
], { error: `use a position name (${SLOT_NAMES.join(", ")}), a number from 0 to 1 or [x, z] in 2.5d mode` });
const MIN_CANVAS_PX = 16;
const MAX_SCALE = 4;
const pixels = z.number().int().min(MIN_CANVAS_PX).max(MAX_CANVAS_PX);
const fraction = z.number().min(0).max(1);

export const canvasSchema = z.looseObject({
  width: pixels.optional().describe("Frame width in px. Default 1200."),
  height: pixels.optional().describe("Frame height in px. Default 630 (classic) or 900 (2.5d, map)."),
  mode: z.enum(MODE_NAMES).optional().describe("classic (default), 2.5d, board or map."),
  theme: z.string().optional().describe("Palette name. See `scenec catalog themes`."),
  kit: z.string().optional().describe("Style kit name. See `scenec catalog kits`."),
  colors: z.record(z.string(), z.string()).optional().describe("Overrides theme colors, for example wall or floor."),
  setting: z.enum(SETTING_NAMES).optional().describe("Where the scene happens. Default outdoor."),
  scale: z.number().positive().max(MAX_SCALE).optional().describe("Camera zoom. Default 1."),
  horizon: fraction.optional().describe("Horizon line as a fraction of the height."),
  base: fraction.optional().describe("Baseline of the nearest ground objects as a fraction of the height."),
  floor: z.string().optional().describe("Indoor floor style, for example planks."),
  vanish: fraction.optional().describe("Vanishing point x for planks."),
  haze: z.boolean().optional().describe("false turns atmospheric perspective off."),
  grain: z.boolean().optional(),
  light: z.union([
    z.literal(false),
    z.looseObject({ from: z.union([z.number(), z.string()]).optional(), strength: fraction.optional() }),
  ]).optional()
    .describe("false, or { from: left|right|front|0..1, strength: 0..1 }."),
  critique: z.boolean().optional().describe("false turns the art director off."),
  shot: z.enum(SHOT_NAMES).optional().describe("Framing: wide (default), full, medium or close."),
  focus: z.union([z.string(), z.array(z.string())]).optional().describe("Object or group ids the shot frames."),
  frame: z.union([z.number(), z.enum(["left", "center", "right"])]).optional().describe("Where the focus sits horizontally."),
  headroom: fraction.optional().describe("Space above the focus as a fraction of the height."),
  camera: z.unknown().optional(),
  depth: z.number().optional(),
  far_y: z.number().optional(),
  near_y: z.number().optional(),
  horizon_z: z.number().optional(),
});

export const objectSchema = z.looseObject({
  asset: z.string().optional().describe("Asset name; defaults to the object id. See `scenec catalog assets`."),
  group: z.string().optional().describe("Ready-made group. See `scenec catalog groups`."),
  parts: z.record(z.string(), z.union([z.literal(false), z.record(z.string(), z.unknown())])).optional()
    .describe("Adjusts a group's parts; false removes one."),
  at: slot.optional().describe("Horizontal position: a slot name or 0..1."),
  size: z.union([z.number().positive(), z.enum(SIZE_NAMES)]).optional(),
  depth: z.enum(DEPTH_NAMES).optional(),
  left_of: z.string().optional(),
  right_of: z.string().optional(),
  behind: z.string().optional(),
  in_front_of: z.string().optional(),
  on: z.string().optional().describe("Sits on another object's surface or seat."),
  under: z.string().optional(),
  above: z.string().optional(),
  holds: z.string().optional(),
  gap: z.number().optional(),
  offset: z.union([z.number(), z.tuple([z.number(), z.number()])], { error: "use a number or [x, z]" }).optional(),
  align: z.union([z.number(), z.string()]).optional(),
  layer: z.enum(["back", "front"]).optional(),
  altitude: z.number().optional(),
  elevation: z.number().optional(),
  lift: z.number().optional(),
  hang: z.number().optional(),
  facing: z.enum(["left", "right"]).optional(),
  pose: z.string().optional().describe("Person pose. See `scenec catalog poses`."),
  expr: z.string().optional().describe("Person expression."),
  look: z.string().optional().describe("Where a person looks: another object id, or left, right, up, down, camera."),
  haze: z.boolean().optional(),
  light: z.boolean().optional(),
  kit: z.boolean().optional(),
  critique: z.boolean().optional(),
  allow_crop: z.boolean().optional(),
});

export const textSchema = z.looseObject({
  content: z.union([z.string(), z.number()]).describe("The text. A newline breaks the line."),
  at: z.string().optional().describe("top-left, top-center, top-right, bottom-left, bottom-center or bottom-right."),
  role: z.enum(["title", "subtitle", "label", "body"]).optional(),
  size: z.number().positive().optional().describe("Font size as a fraction of the height."),
  y: z.number().optional(),
  x: z.number().optional(),
  color: z.string().optional(),
  box: z.string().optional().describe("Background color behind the text."),
  pad: z.number().optional(),
  radius: z.number().optional(),
  weight: z.number().optional(),
});

export const mapSchema = z.looseObject({
  panel: z.boolean().optional().describe("false hides the route panel."),
  center: z.tuple([z.number(), z.number()]).optional().describe("[lon, lat] of the projection center. Default: the mean of the stops."),
  padding: z.number().optional().describe("Degrees of margin around the stops. Default 3.5."),
  bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("[lonMin, lonMax, latMin, latMax] to show."),
  highlight: z.array(z.string()).optional().describe("Extra countries to color, by name."),
  palette: z.array(z.string()).optional().describe("Colors for the highlighted countries, in order."),
});

export const routeItemSchema = z.looseObject({
  city: z.string().optional().describe("A city from the dictionary (see `scenec catalog`), or any name together with `at`."),
  at: z.tuple([z.number(), z.number()]).optional().describe("[lon, lat] for a city that is not in the dictionary."),
  country: z.string().optional().describe("Country to color on the map."),
  label: z.string().optional().describe("Name shown instead of the city name."),
  note: z.string().optional(),
  by: z.string().optional().describe("A route item with only `by` sets the transport of the next leg: plane, train, car, bus or boat."),
});

export const sceneSchema = z.looseObject({
  version: z.literal(1).optional(),
  canvas: canvasSchema.optional(),
  objects: z.record(z.string(), objectSchema).optional(),
  text: z.array(textSchema).optional(),
  assets: z.record(z.string(), z.looseObject({})).optional().describe("Custom assets: svg (inline or a file) or image."),
  path: z.looseObject({}).optional(),
  scatter: z.unknown().optional(),
  zones: z.record(z.string(), z.unknown()).optional(),
  walls: z.looseObject({}).optional(),
  floor: z.looseObject({}).optional(),
  boxes: z.record(z.string(), z.unknown()).optional(),
  map: mapSchema.optional(),
  route: z.array(routeItemSchema).optional(),
});

export type SettingName = (typeof SETTING_NAMES)[number];

export type SlotName = (typeof SLOT_NAMES)[number];

export type SizeName = (typeof SIZE_NAMES)[number];

export type ShotName = (typeof SHOT_NAMES)[number];

export type Scene = z.infer<typeof sceneSchema>;

export type SceneObject = z.infer<typeof objectSchema>;

export type Canvas = z.infer<typeof canvasSchema>;

export type SceneText = z.infer<typeof textSchema>;

export type MapOptions = z.infer<typeof mapSchema>;

export type RouteItem = z.infer<typeof routeItemSchema>;

export type TextRole = NonNullable<SceneText["role"]>;

export type ObjectLayer = NonNullable<SceneObject["layer"]>;

export const OBJECT_PARAM_KEYS = [
  "age", "along", "art", "backpack", "beard", "bg", "bottom", "build", "cane", "color", "count", "details", "dist", "doors",
  "draped", "drawers", "drop", "ends", "expr", "floors", "food", "frame", "gaze", "glasses", "gown", "hair", "hair_color",
  "handle", "hat", "hat_color", "height", "jacket", "label", "logo", "mic", "near", "off", "on_path", "on_spot", "outfit",
  "pants", "people", "person", "pot", "role", "screen", "seed", "shirt", "shoes", "side", "skin", "sleeve", "stand", "steam",
  "stole", "style", "thickness", "view", "width",
] as const;
