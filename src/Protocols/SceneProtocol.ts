import { FONT_NAMES, type FontName } from "@/Protocols/KitProtocol.ts";
import { z } from "zod";
import { DETAIL_NAMES } from "@/Protocols/AssetProtocol.ts";
import { BODY_NAMES } from "@/Protocols/PersonProtocol.ts";

export const SLOT_NAMES = ["far-left", "left", "center-left", "center", "center-right", "right", "far-right"] as const;
export const SIZE_NAMES = ["tiny", "small", "medium", "large", "huge"] as const;
export const DEPTH_NAMES = ["far", "mid", "near"] as const;
export const MODE_NAMES = ["classic", "2.5d", "board", "map"] as const;

export type ModeName = (typeof MODE_NAMES)[number];
export const SETTING_NAMES = ["outdoor", "indoor", "beach", "city"] as const;
export const SHOT_NAMES = ["wide", "full", "medium", "close"] as const;
export const HARMONY_NAMES = ["analogous", "complementary", "split", "triad", "mono"] as const;
export type HarmonyName = (typeof HARMONY_NAMES)[number];
export const MOOD_NAMES = ["day", "dusk", "night"] as const;
export type MoodName = (typeof MOOD_NAMES)[number];
export const TIME_NAMES = ["golden", "noon", "overcast", "dusk", "night"] as const;
export type TimeName = (typeof TIME_NAMES)[number];
export const RIDGES_MIN = 0;
export const RIDGES_MAX = 4;
export const CLOUD_DENSITIES = ["none", "few", "many"] as const;
export type CloudDensity = (typeof CLOUD_DENSITIES)[number];
export const GROUND_DETAILS = ["none", "low", "high"] as const;
export type GroundDetail = (typeof GROUND_DETAILS)[number];
export const FRAMING_ELEMENTS = ["foliage", "curtain", "plants", "none"] as const;
export type FramingElement = (typeof FRAMING_ELEMENTS)[number];
export const BOX_STYLES = ["rect", "highlight", "pill", "sticker", "underline"] as const;
export type BoxStyle = (typeof BOX_STYLES)[number];
export const MAX_OBJECTS = 200;
export const MAX_CANVAS_PX = 4096;

export const MAX_SEED_COLORS = 3;

export const generatedThemeSchema = z.looseObject({
  from: z.union([z.string(), z.array(z.string()).min(1).max(MAX_SEED_COLORS)]).describe("One to three seed colors."),
  harmony: z.enum(HARMONY_NAMES).optional().describe("analogous (default), complementary, split, triad or mono."),
  mood: z.enum(MOOD_NAMES).optional().describe("day (default), dusk or night."),
});
export type GeneratedTheme = z.infer<typeof generatedThemeSchema>;

const slot = z.union([
  z.number(),
  z.enum([...SLOT_NAMES, ...SLOT_NAMES.map((name) => `top-${name}` as const), ...SLOT_NAMES.map((name) => `sky-${name}` as const)]),
  z.tuple([z.number(), z.number()]),
], { error: `use a position name (${SLOT_NAMES.join(", ")}), a number from 0 to 1 or [x, z] in 2.5d mode` });
const MIN_CANVAS_PX = 16;
const MAX_SCALE = 4;
const pixels = z.number().int().min(MIN_CANVAS_PX).max(MAX_CANVAS_PX);
const fraction = z.number().min(0).max(1);

export const CAMERA_PRESETS = ["board", "room"] as const;

export const cameraSchema = z.union([
  z.enum(CAMERA_PRESETS),
  z.looseObject({
    preset: z.enum(CAMERA_PRESETS).optional(),
    horizon: z.number().optional(),
    near_y: z.number().optional(),
    depth: z.number().optional(),
    vanish_x: z.number().optional(),
    cx: z.number().optional(),
    x_span: z.number().optional(),
    unit: z.number().optional(),
  }),
]).describe("2.5d camera: board (high and far, default) or room (real perspective, for interiors), with optional overrides.");

export const canvasSchema = z.looseObject({
  width: pixels.optional().describe("Frame width in px. Default 1200."),
  height: pixels.optional().describe("Frame height in px. Default 630 (classic) or 900 (2.5d, map)."),
  mode: z.enum(MODE_NAMES).optional().describe("classic (default), 2.5d, board or map."),
  theme: z.union([z.string(), generatedThemeSchema]).optional()
    .describe("Palette name or { from, harmony, mood }. See `scenec catalog themes`."),
  time: z.enum(TIME_NAMES).optional().describe("Time of day: golden, noon, overcast, dusk or night."),
  kit: z.string().optional().describe("Style kit name. See `scenec catalog kits`."),
  font: z.enum(FONT_NAMES).optional().describe("Default font: sans, serif or hand."),
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
    z.looseObject({
      from: z.union([z.number(), z.string()]).optional(),
      strength: fraction.optional(),
      shafts: z.boolean().optional().describe("false turns off indoor window light shafts."),
    }),
  ]).optional()
    .describe("false, or { from: left|right|front|0..1, strength: 0..1, shafts: boolean }."),
  seed: z.number().optional().describe("Seed for procedural background details."),
  ridges: z.number().int().min(RIDGES_MIN).max(RIDGES_MAX).optional()
    .describe("Number of procedural ridge layers (0..4). Default 2 for outdoor, 0 for city/beach."),
  clouds: z.enum(CLOUD_DENSITIES).optional().describe("Ambient sky clouds: none, few or many."),
  ground_detail: z.enum(GROUND_DETAILS).optional().describe("Ground texture and tufts: none, low or high."),
  framing: z.enum(FRAMING_ELEMENTS).optional()
    .describe("Foreground framing elements: foliage, curtain, plants or none."),
  frame_elements: z.enum(FRAMING_ELEMENTS).optional().describe("Alias for canvas.framing."),
  critique: z.boolean().optional().describe("false turns the art director off."),
  shot: z.enum(SHOT_NAMES).optional().describe("Framing: wide (default), full, medium or close."),
  focus: z.union([z.string(), z.array(z.string())]).optional().describe("Object or group ids the shot frames."),
  frame: z.union([z.number(), z.enum(["left", "center", "right"])]).optional().describe("Where the focus sits horizontally."),
  headroom: fraction.optional().describe("Space above the focus as a fraction of the height."),
  camera: cameraSchema.optional(),
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
  along: z.number().optional().describe("2.5d: position along the path, 0..1."),
  side: z.enum(["left", "right"]).optional().describe("2.5d: which side of the path an `along` object stands on."),
  dist: z.number().optional().describe("2.5d: distance from the path for an `along` object."),
  near: z.string().optional().describe("2.5d: id of an object or path point to place this one next to."),
  on_spot: z.boolean().optional().describe("2.5d: stand exactly on the `near` point."),
  on_path: z.boolean().optional().describe("2.5d: true when standing on the path is intended."),
  elevation: z.number().optional(),
  lift: z.number().optional(),
  hang: z.number().optional(),
  facing: z.enum(["left", "right"]).optional(),
  pose: z.string().optional().describe("Person pose. See `scenec catalog poses`."),
  expr: z.string().optional().describe("Person expression."),
  look: z.string().optional().describe("Where a person looks: another object id, or left, right, up, down, camera."),
  body: z.enum(BODY_NAMES).optional().describe("Person proportions: chibi, standard or long."),
  detail: z.enum(DETAIL_NAMES).optional().describe(
    "How much is drawn: low drops small parts, high adds highlights and texture. Defaults: focus high, far low, else mid.",
  ),
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
  font: z.enum(FONT_NAMES).optional().describe("Font family: sans, serif or hand."),
  box: z.string().optional().describe("Background color behind the text."),
  box_style: z.enum(BOX_STYLES).optional().describe("Caption container style: rect, highlight, pill, sticker or underline."),
  emphasis: z.array(z.string()).optional().describe("Key words to underline in the underline style."),
  tracking: z.number().optional().describe("Letter spacing in em."),
  wrap: z.number().int().positive().optional().describe("Max line width in characters to wrap text."),
  balance: z.boolean().optional().describe("Balance line lengths for multi-line titles."),
  rotation: z.number().optional().describe("Rotation angle in degrees (for sticker style)."),
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

const point = z.tuple([z.number(), z.number()]);

export const LABEL_SIDES = ["left", "right", "below"] as const;
export const BOX_FRONTS = ["drawers", "doors", "open"] as const;
export const BOX_FACES = ["front", "left", "right"] as const;

export const pathPointSchema = z.looseObject({
  id: z.string().optional().describe("Name other objects can use in `near`."),
  at: point.optional().describe("[x, z] on the ground: x 0..1 left to right, z 0..1 near to far."),
  label: z.string().optional(),
  zone: z.string().optional().describe("A zone name; its scenery is placed around this point."),
  finish: z.boolean().optional(),
  color: z.string().optional(),
  label_side: z.enum(LABEL_SIDES).optional(),
  decor: z.boolean().optional().describe("false skips the zone scenery for this point."),
});

export const pathSchema = z.looseObject({
  points: z.array(pathPointSchema).optional(),
  width: z.number().optional().describe("Road width in world units. Default 0.075."),
  checkpoint_size: z.number().optional().describe("Checkpoint radius in world units. Default 0.042."),
  color: z.string().optional(),
  tiles: z.boolean().optional().describe("false removes the tiles on the road."),
  tile_length: z.number().optional(),
});

export const zoneDecorSchema = z.looseObject({
  asset: z.string(),
  size: z.number().optional(),
});

export const zoneSchema = z.looseObject({
  tint: z.string().optional().describe("A theme color name or a color."),
  radius: z.number().optional(),
  decor: z.array(zoneDecorSchema).optional(),
});

export const boxDetailsSchema = z.looseObject({
  type: z.enum(BOX_FRONTS).optional(),
  count: z.number().optional(),
  face: z.enum(BOX_FACES).optional(),
  plinth: z.number().optional(),
  handle: z.string().optional(),
  shelves: z.array(z.number()).optional(),
});

export const boxSchema = z.looseObject({
  from: point.optional(),
  to: point.optional(),
  height: z.number().optional().describe("Top of the box above the floor. Default 40."),
  elevation: z.number().optional().describe("Bottom of the box above the floor."),
  thickness: z.number().optional(),
  color: z.string().optional(),
  top_color: z.string().optional(),
  opacity: z.number().optional(),
  shadow: z.boolean().optional(),
  details: boxDetailsSchema.optional(),
  front: z.enum(BOX_FRONTS).optional(),
  count: z.number().optional(),
});

export const scatterSchema = z.looseObject({
  seed: z.number().optional(),
  assets: z.array(z.string()).optional(),
  area: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("[x0, z0, x1, z1]."),
  count: z.number().optional(),
  size: z.number().optional(),
});

const wallSideSchema = z.looseObject({ x: z.number().optional(), color: z.string().optional() });

export const wallsSchema = z.looseObject({
  back: z.looseObject({ z: z.number().optional(), color: z.string().optional() }).optional(),
  right: z.union([z.literal(false), wallSideSchema]).optional(),
  left: wallSideSchema.optional(),
  height: z.number().optional(),
});

export const floorSchema = z.looseObject({
  color: z.string().optional(),
  planks: z.boolean().optional(),
  plank_width: z.number().optional(),
  from_z: z.number().optional(),
});

export const sceneSchema = z.looseObject({
  version: z.literal(1).optional(),
  canvas: canvasSchema.optional(),
  objects: z.record(z.string(), objectSchema).optional(),
  text: z.array(textSchema).optional(),
  assets: z.record(z.string(), z.looseObject({})).optional().describe("Custom assets: svg (inline or a file) or image."),
  path: pathSchema.optional(),
  scatter: z.array(scatterSchema).optional(),
  zones: z.record(z.string(), zoneSchema).optional(),
  walls: wallsSchema.optional(),
  floor: floorSchema.optional(),
  boxes: z.record(z.string(), boxSchema).optional(),
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

export type Camera25 = z.infer<typeof cameraSchema>;

export type PathOptions = z.infer<typeof pathSchema>;

export type ZoneDecor = z.infer<typeof zoneDecorSchema>;

export type BoxDetails = z.infer<typeof boxDetailsSchema>;

export type BoxOptions = z.infer<typeof boxSchema>;

export type ScatterOptions = z.infer<typeof scatterSchema>;

export type WallsOptions = z.infer<typeof wallsSchema>;

export type FloorOptions = z.infer<typeof floorSchema>;

export type { FontName };

export type TextRole = NonNullable<SceneText["role"]>;

export type ObjectLayer = NonNullable<SceneObject["layer"]>;

export const OBJECT_PARAM_KEYS = [
  "age", "art", "backpack", "beard", "bg", "bottom", "build", "cane", "color", "count", "details", "doors",
  "draped", "drawers", "drop", "ends", "expr", "floors", "food", "frame", "gaze", "glasses", "gown", "hair", "hair_color",
  "handle", "hat", "hat_color", "height", "jacket", "label", "logo", "mic", "off", "outfit",
  "pants", "people", "person", "pot", "role", "screen", "seed", "shirt", "shoes", "skin", "sleeve", "stand", "steam",
  "stole", "style", "thickness", "view", "width",
] as const;
