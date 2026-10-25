import { ColorUtil } from "@/Utils/ColorUtil.ts";
import type { AssetDrawing, Facing } from "@/Protocols/AssetProtocol.ts";
import {
  EXPRESSION_NAMES, SEATED_POSE_NAMES, STANDING_POSE_NAMES,
  type AgeName, type BendName, type BodyScale, type BuildName, type GazeName, type PersonParams, type Point,
  type SeatedPoseName, type StandingPoseName,
} from "@/Protocols/PersonProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { FallbackUtil } from "@/Utils/FallbackUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { PersonArmUtil } from "@/Utils/PersonArmUtil.ts";
import { PersonHeadUtil } from "@/Utils/PersonHeadUtil.ts";
import { PersonOutfitUtil, type PersonLook } from "@/Utils/PersonOutfitUtil.ts";

interface FrontPose {
  left: Point;
  right: Point;
  isLeftOpen?: boolean;
  isRightOpen?: boolean;
  bendLeft?: BendName;
  bendRight?: BendName;
}

interface AgeScale {
  bx: number;
  by: number;
  hs: number;
}

type SeatedProp = (hand: Point, facing: number, theme: Theme) => string;

interface DrawnPerson {
  svg: string;
  hand: Point;
}

export class PersonUtil {
  static readonly EXPRESSION_NAMES = [...EXPRESSION_NAMES];

  // Why: units are such that a standing person is 100 tall with the origin at the feet; poses only say where the hands go.
  private static readonly POSE_NAME_TO_FRONT_POSE: Record<StandingPoseName, FrontPose> = {
    standing: { left: [-15, -46], right: [15, -46] },
    waving: { left: [-15, -46], right: [27, -105], isRightOpen: true },
    pointing: { left: [-15, -46], right: [46, -77] },
    presenting: { left: [-15, -46], right: [36, -66], isRightOpen: true, bendRight: "down" },
    celebrating: { left: [-24, -108], right: [24, -108], isLeftOpen: true, isRightOpen: true },
    holding: { left: [-15, -46], right: [21, -57] },
    hands_on_hips: { left: [-12, -50], right: [12, -50] },
    thinking: { left: [-7, -57], right: [5, -82], bendRight: "down" },
    shrugging: { left: [-27, -66], right: [27, -66], isLeftOpen: true, isRightOpen: true },
    walking: { left: [-8, -49], right: [19, -51] },
    phone: { left: [-15, -46], right: [10, -88] },
  };

  private static readonly STANDING_POSE: FrontPose = { left: [-15, -46], right: [15, -46] };

  private static readonly POSE_NAME_TO_SIDE_HANDS: Record<SeatedPoseName, Point> = {
    sitting: [20, -50], typing: [35, -55], reading: [22, -66], drinking: [10, -82],
  };

  private static readonly TYPING_HANDS: Point = [35, -55];

  static readonly POSE_NAMES = { standing: [...STANDING_POSE_NAMES], seated: [...SEATED_POSE_NAMES] };

  private static readonly AGE_TO_SCALE: Record<AgeName, AgeScale> = {
    child: { bx: 0.8, by: 0.58, hs: 0.93 },
    teen: { bx: 0.9, by: 0.86, hs: 0.97 },
    adult: { bx: 1, by: 1, hs: 1 },
    elder: { bx: 1, by: 0.95, hs: 1 },
  };

  private static readonly ADULT_SCALE: AgeScale = { bx: 1, by: 1, hs: 1 };

  private static readonly BUILD_TO_WIDTH: Record<BuildName, number> = {
    slim: 0.88, average: 1, broad: 1.12, heavy: 1.16,
  };

  private static readonly MIN_HEIGHT = 0.8;

  private static readonly MAX_HEIGHT = 1.2;

  private static readonly LOOK_TO_GAZE: Record<GazeName, Point> = {
    "left": [-1, 0], "right": [1, 0], "up": [0, -1], "down": [0, 1], "up-left": [-0.8, -0.7], "up-right": [0.8, -0.7],
    "down-left": [-0.8, 0.7], "down-right": [0.8, 0.7], "camera": [0, 0], "forward": [0, 0],
  };

  private static readonly POSE_TO_GAZE: Partial<Record<StandingPoseName | SeatedPoseName, Point>> = {
    pointing: [1, -0.3], presenting: [0.8, 0], thinking: [-0.5, -0.8], celebrating: [0, -0.5], phone: [0.5, 0.4],
    holding: [0.5, 0.3], reading: [0.5, 0.9], typing: [1, 0.15], drinking: [0.6, 0], sitting: [0.6, 0],
  };

  private static readonly FACING_TO_SIDE: Record<Facing, number> = { left: -1, right: 1 };

  private static readonly POSE_TO_SEATED_PROP: Partial<Record<SeatedPoseName, SeatedProp>> = {
    reading: (hand, facing, theme) => PersonUtil.book(hand, facing, theme),
    drinking: (hand, facing, theme) => PersonUtil.cup(hand, facing, theme),
  };

  private static readonly SEATED_HEAD_TILT = 7;

  private static readonly STANDING_HEAD_TILT = 6;

  private static readonly FRONT_HEAD_TILT = 4;

  private static readonly CANE_REST_HEIGHT = 6;

  static bodyScale(params: PersonParams = {}): BodyScale {
    const age = IdUtil.lookup(PersonUtil.AGE_TO_SCALE, params.age) ?? PersonUtil.ADULT_SCALE;
    const requested = Number(params.height) || 1;
    const heightFactor = Math.max(PersonUtil.MIN_HEIGHT, Math.min(PersonUtil.MAX_HEIGHT, requested));
    const width = IdUtil.lookup(PersonUtil.BUILD_TO_WIDTH, params.build) ?? 1;
    return { bx: age.bx * width, by: age.by * heightFactor, hs: age.hs };
  }

  private static gazeOf(params: PersonParams, pose: string, facing = 1): Point {
    // Why: the compiler resolves `look: <id>` into a gaze vector; names such as "left" or "camera" are resolved here.
    if (Array.isArray(params.gaze)) {
      return [params.gaze[0] ?? 0, params.gaze[1] ?? 0];
    }
    const named = IdUtil.lookup(PersonUtil.LOOK_TO_GAZE, params.look);
    if (named) {
      return named;
    }
    const byPose = IdUtil.lookup(PersonUtil.POSE_TO_GAZE, pose);
    return byPose ? [byPose[0] * facing, byPose[1]] : [0, 0];
  }

  static person(params: PersonParams, theme: Theme): AssetDrawing {
    const look = PersonOutfitUtil.lookOf(params, theme);
    const scale = PersonUtil.bodyScale(params);
    const pose = FallbackUtil.nonEmpty(params.pose, "standing");
    const round = (value: number): number => PersonArmUtil.round(value);
    const shadow = `<ellipse cx="0" cy="0" rx="${round(20 * scale.bx)}" ry="3.2" fill="${theme.shadow}"/>`;
    const isSeated = IdUtil.isOneOf(SEATED_POSE_NAMES, pose) || pose === "sitting_typing";
    const drawn = isSeated
      ? PersonUtil.seated(params, look, scale, pose)
      : PersonUtil.standing(params, look, scale, pose);
    return {
      svg: shadow + drawn.svg,
      hand: [drawn.hand[0] * scale.bx, drawn.hand[1] * scale.by],
      box: { w: 40 * scale.bx, h: 81 * scale.by + 27 * scale.hs },
    };
  }

  private static bodyGroup(scale: BodyScale, content: string): string {
    const round = (value: number): number => PersonArmUtil.round(value);
    return `<g transform="scale(${round(scale.bx)} ${round(scale.by)})">${content}</g>`;
  }

  private static headGroup(scale: BodyScale, content: string, tilt = 0): string {
    const round = (value: number): number => PersonArmUtil.round(value);
    const shift = round(-81 * scale.by + 81 * scale.hs);
    return `<g transform="translate(0 ${shift}) scale(${round(scale.hs)}) rotate(${round(tilt)} 0 -82)">${content}</g>`;
  }

  private static seated(params: PersonParams, look: PersonLook, scale: BodyScale, pose: string): DrawnPerson {
    const { theme, skin, sleeve, isShortSleeve } = look;
    const facing = IdUtil.lookup(PersonUtil.FACING_TO_SIDE, params.facing) ?? 1;
    const target = IdUtil.lookup(PersonUtil.POSE_NAME_TO_SIDE_HANDS, pose) ?? PersonUtil.TYPING_HANDS;
    const shoulder: Point = [facing * 2, -75];
    // Why: the seated view is a profile; the back arm is darker than the front arm.
    const backArm = PersonArmUtil.ik(shoulder, [target[0] * facing - facing * 4, target[1] + 2], facing, "down");
    const frontArm = PersonArmUtil.ik(shoulder, [target[0] * facing, target[1]], facing, "down");
    const backSkin = ColorUtil.sh(skin, -0.15);
    const backColors = { sleeve: ColorUtil.sh(sleeve, -0.18), skin: backSkin };
    const armsBack = PersonArmUtil.armPath(shoulder, backArm, backColors, isShortSleeve)
      + PersonArmUtil.hand(backArm.hand, backSkin, false, backArm.elbow);
    const armsFront = PersonArmUtil.armPath(shoulder, frontArm, { sleeve, skin }, isShortSleeve)
      + PersonArmUtil.hand(frontArm.hand, skin, false, frontArm.elbow);
    const gaze = PersonUtil.gazeOf(params, pose, facing);
    const head = PersonHeadUtil.head(params, theme, { side: facing, isBack: false, gaze });
    const legs = PersonOutfitUtil.seatedLegs(look, facing);
    const torso = PersonOutfitUtil.seatedTorso(look, facing);
    const prop = PersonUtil.seatedProp(pose, frontArm.hand, facing, theme);
    const svg = PersonUtil.bodyGroup(scale, armsBack + legs + torso)
      + PersonUtil.headGroup(scale, head, facing * gaze[1] * PersonUtil.SEATED_HEAD_TILT)
      + PersonUtil.bodyGroup(scale, armsFront + prop);
    return { svg, hand: frontArm.hand };
  }

  private static seatedProp(pose: string, hand: Point, facing: number, theme: Theme): string {
    return IdUtil.lookup(PersonUtil.POSE_TO_SEATED_PROP, pose)?.(hand, facing, theme) ?? "";
  }

  private static book(hand: Point, facing: number, theme: Theme): string {
    const round = (value: number): number => PersonArmUtil.round(value);
    const [handX, handY] = hand;
    return `<path d="M${round(handX - facing * 2)} ${round(handY - 9)} L${round(handX + facing * 8)} ${round(handY - 6)} `
      + `L${round(handX + facing * 8)} ${round(handY + 4)} L${round(handX - facing * 2)} ${round(handY + 1)} Z" `
      + `fill="${theme.accent}"/>`;
  }

  private static cup(hand: Point, facing: number, theme: Theme): string {
    const round = (value: number): number => PersonArmUtil.round(value);
    const [handX, handY] = hand;
    return `<path d="M${round(handX + facing * 1)} ${round(handY - 7)} L${round(handX + facing * 9)} ${round(handY - 7)} `
      + `L${round(handX + facing * 8)} ${round(handY + 3)} L${round(handX + facing * 2)} ${round(handY + 3)} Z" `
      + `fill="${theme.paper}"/>`;
  }

  private static standing(params: PersonParams, look: PersonLook, scale: BodyScale, pose: string): DrawnPerson {
    const { theme, skin, sleeve, isShortSleeve } = look;
    const isBack = params.view === "back";
    const targets = IdUtil.lookup(PersonUtil.POSE_NAME_TO_FRONT_POSE, pose) ?? PersonUtil.STANDING_POSE;
    const side = IdUtil.lookup(PersonUtil.FACING_TO_SIDE, params.facing) ?? 0;
    const legs = PersonOutfitUtil.standingLegs(look, pose === "walking");
    const backpack = PersonOutfitUtil.backpack(look, params, isBack);
    const torso = PersonOutfitUtil.standingTorso(look, params, isBack) + backpack.onTorso;
    const hat = PersonOutfitUtil.hat(look, params, side);
    const leftShoulder: Point = [-12, -76];
    const rightShoulder: Point = [12, -76];
    const left = PersonArmUtil.ik(leftShoulder, targets.left, -1, targets.bendLeft);
    const right = PersonArmUtil.ik(rightShoulder, targets.right, 1, targets.bendRight);
    const colors = { sleeve, skin };
    const isLeftOpen = Boolean(targets.isLeftOpen);
    const isRightOpen = Boolean(targets.isRightOpen);
    const arms = PersonArmUtil.armPath(leftShoulder, left, colors, isShortSleeve)
      + PersonArmUtil.hand(left.hand, skin, isLeftOpen, left.elbow)
      + PersonArmUtil.armPath(rightShoulder, right, colors, isShortSleeve)
      + PersonArmUtil.hand(right.hand, skin, isRightOpen, right.elbow);
    if (isBack) {
      const head = PersonHeadUtil.head(params, theme, { side: 0, isBack: true, gaze: [0, 0] });
      const backSvg = PersonUtil.bodyGroup(scale, legs + torso + arms) + PersonUtil.headGroup(scale, head + hat);
      return { svg: backSvg, hand: right.hand };
    }
    const gaze = PersonUtil.gazeOf(params, pose, side || 1);
    const tilt = side ? side * gaze[1] * PersonUtil.STANDING_HEAD_TILT : gaze[0] * PersonUtil.FRONT_HEAD_TILT;
    const head = PersonHeadUtil.head(params, theme, { side, isBack: false, gaze });
    const cane = PersonUtil.cane(params, targets, left.hand, theme);
    const phone = PersonUtil.phone(pose, right.hand, theme);
    const svg = PersonUtil.bodyGroup(scale, legs + backpack.behind + torso)
      + PersonUtil.headGroup(scale, head + hat, tilt)
      + PersonUtil.bodyGroup(scale, cane + arms + phone);
    return { svg, hand: right.hand };
  }

  private static cane(params: PersonParams, targets: FrontPose, hand: Point, theme: Theme): string {
    // Why: the cane leans on the left hand only while that hand is at rest.
    if (!params.cane || Math.abs(targets.left[1] + 46) >= PersonUtil.CANE_REST_HEIGHT) {
      return "";
    }
    const round = (value: number): number => PersonArmUtil.round(value);
    const wood = theme.trunk || "#6B4A33";
    return `<path d="M${round(hand[0] - 1)} ${round(hand[1] + 2)} L${round(hand[0] - 4)} -1" `
      + `stroke="${wood}" stroke-width="2.4" stroke-linecap="round"/>`
      + `<path d="M${round(hand[0] - 1)} ${round(hand[1] + 2)} Q${round(hand[0] + 1)} ${round(hand[1] - 4)} `
      + `${round(hand[0] + 5)} ${round(hand[1] - 1)}" stroke="${wood}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }

  private static phone(pose: string, hand: Point, theme: Theme): string {
    if (pose !== "phone") {
      return "";
    }
    const round = (value: number): number => PersonArmUtil.round(value);
    return `<rect x="${round(hand[0] - 1.5)}" y="${round(hand[1] - 8)}" width="4.6" height="8.5" rx="1.2" `
      + `fill="${theme.ink}"/><rect x="${round(hand[0] - 0.8)}" y="${round(hand[1] - 7.2)}" width="3.2" height="6.4" `
      + `rx="0.6" fill="${theme.glass || "#BFD7EA"}"/>`;
  }
}
