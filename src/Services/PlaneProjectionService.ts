import type { HazeStep, PlaneCamera, ScreenPoint } from "@/Protocols/PlaneProtocol.ts";
import type { Camera25, Canvas } from "@/Protocols/SceneProtocol.ts";

interface RoomCamera {
  horizon: number;
  nearY: number;
  depth: number;
  vanishX: number;
  centerX: number;
  xSpan: number;
  unit: number;
}

interface Lens {
  eyeX: number;
  unit: number;
  spread: (groundZ: number) => number;
  screenX: (groundX: number, groundZ: number) => number;
  screenY: (groundZ: number) => number;
}

interface Frame {
  width: number;
  height: number;
  zoom: number;
  shrink: (groundZ: number) => number;
}

type CameraOverrides = Exclude<Camera25, string>;

export class PlaneProjectionService {
  private static readonly HAZE_STEPS: readonly HazeStep[] = [
    { depth: 0.6, strength: 0.1 },
    { depth: 0.85, strength: 0.2 },
    { depth: 1.15, strength: 0.34 },
  ];

  private static readonly BOARD_DEPTH = 0.9;

  private static readonly BOARD_NEAR_Y = 0.97;

  private static readonly BOARD_FAR_Y = 0.32;

  private static readonly BOARD_UNIT = 0.00165;

  private static readonly BOARD_SPREAD_MIN = 0.72;

  private static readonly BOARD_SPREAD_RANGE = 0.28;

  private static readonly FRAME_FILL = 0.98;

  static create(canvas: Canvas, width: number, height: number): PlaneCamera {
    const room = PlaneProjectionService.roomOf(canvas.camera);
    const depth = room?.depth ?? canvas.depth ?? PlaneProjectionService.BOARD_DEPTH;
    const shrink = (groundZ: number): number => 1 / (1 + depth * Math.max(groundZ, -0.85 / depth));
    const frame: Frame = { width, height, zoom: canvas.scale ?? 1, shrink };
    const lens = room
      ? PlaneProjectionService.roomLens(room, frame)
      : PlaneProjectionService.boardLens(canvas, frame, depth);
    const { unit, spread, screenX, screenY } = lens;
    const fill = PlaneProjectionService.FRAME_FILL;
    const pxPerUnit = (groundZ: number, factor = 1): number => unit * shrink(groundZ) * factor;
    const isHazeOff = canvas.haze === false || (room && canvas.haze !== true);
    const hazeSteps = isHazeOff ? null : PlaneProjectionService.HAZE_STEPS;
    return {
      width, height, isRoom: Boolean(room), unit, eyeX: lens.eyeX, hazeSteps,
      shrink, screenX, screenY, spread, pxPerUnit,
      worldRadius: (widthUnits, groundZ, factor = 1) =>
        (widthUnits * pxPerUnit(groundZ, factor)) / 2 / (width * fill * spread(groundZ)),
      project: (groundX, groundZ, heightUnits = 0): ScreenPoint => [
        screenX(groundX, groundZ), screenY(groundZ) - heightUnits * unit * shrink(groundZ),
      ],
      hazeLevel: (groundZ) => hazeSteps?.filter((step) => groundZ >= step.depth).length ?? 0,
    };
  }

  private static roomOf(camera: Camera25 | undefined): RoomCamera | null {
    const options: CameraOverrides = typeof camera === "string" ? { preset: camera } : (camera ?? {});
    // Why: the board camera is high and far (maps, game boards); the room camera has real perspective (interiors). Naming a horizon asks for the room camera.
    if (options.preset !== "room" && options.horizon === undefined) {
      return null;
    }
    return {
      horizon: options.horizon ?? 0.48,
      nearY: options.near_y ?? 1,
      depth: options.depth ?? 0.7,
      vanishX: options.vanish_x ?? 0.5,
      centerX: options.cx ?? 0.5,
      xSpan: options.x_span ?? 1.17,
      unit: options.unit ?? 0.0093,
    };
  }

  private static roomLens(room: RoomCamera, frame: Frame): Lens {
    const { width, height, zoom, shrink } = frame;
    const horizonY = height * room.horizon;
    const nearY = height * room.nearY;
    return {
      eyeX: room.centerX,
      unit: height * room.unit * zoom,
      spread: (groundZ) => room.xSpan * shrink(groundZ) / PlaneProjectionService.FRAME_FILL,
      screenX: (groundX, groundZ) =>
        width * room.vanishX + (groundX - room.centerX) * width * room.xSpan * shrink(groundZ),
      screenY: (groundZ) => horizonY + (nearY - horizonY) * shrink(groundZ),
    };
  }

  private static boardLens(canvas: Canvas, frame: Frame, depth: number): Lens {
    const { width, height, zoom, shrink } = frame;
    const nearY = height * (canvas.near_y ?? PlaneProjectionService.BOARD_NEAR_Y);
    const farY = height * (canvas.far_y ?? PlaneProjectionService.BOARD_FAR_Y);
    const horizonY = (farY * (1 + depth) - nearY) / depth;
    const farShrink = 1 / (1 + depth);
    const spread = (groundZ: number): number => PlaneProjectionService.BOARD_SPREAD_MIN
      + PlaneProjectionService.BOARD_SPREAD_RANGE * (shrink(groundZ) - farShrink) / (1 - farShrink);
    return {
      eyeX: 0.5,
      unit: height * PlaneProjectionService.BOARD_UNIT * zoom,
      spread,
      screenX: (groundX, groundZ) =>
        width / 2 + (groundX - 0.5) * width * PlaneProjectionService.FRAME_FILL * spread(groundZ),
      screenY: (groundZ) => horizonY + (nearY - horizonY) * shrink(groundZ),
    };
  }
}
