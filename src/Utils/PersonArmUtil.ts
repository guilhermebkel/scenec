import type { Arm, BendName, Point } from "@/Protocols/PersonProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";

export class PersonArmUtil {
  private static readonly UPPER_ARM = 17;

  private static readonly FOREARM = 16;

  private static readonly REACH_MARGIN = 0.01;

  private static readonly MIN_REACH_MARGIN = 0.5;

  private static readonly FINGER_ANGLES = [-27, -9, 9, 27];

  private static readonly FINGER_LENGTHS = [2.4, 3.1, 2.9, 2.1];

  private static readonly SHORT_SLEEVE_SPLIT = 0.6;

  private static readonly SLEEVE_WIDTHS = [8.4, 6.8, 5.4];

  private static readonly SKIN_WIDTHS = [7, 5.8, 4.8];

  private static readonly SHORT_SLEEVE_WIDTHS = [8.6, 7.8];

  private static readonly MAX_MITER = 1.6;

  private static readonly MIN_MITER_DOT = 0.5;

  private static readonly FOLD_HALF_WIDTH = 3;

  private static readonly FOLD_SHADE = 0.22;

  private static readonly HALF_TURN_DEGREES = 180;

  private static readonly BODY_CENTER_Y = -60;

  static round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  static ik(shoulder: Point, target: Point, side: number, bend: BendName = "out"): Arm {
    // Why: arms use two-bone inverse kinematics, so a pose only says where the hands go and the elbow is computed.
    const upperArm = PersonArmUtil.UPPER_ARM;
    const forearm = PersonArmUtil.FOREARM;
    let deltaX = target[0] - shoulder[0];
    let deltaY = target[1] - shoulder[1];
    let distance = Math.hypot(deltaX, deltaY);
    const maxReach = upperArm + forearm - PersonArmUtil.REACH_MARGIN;
    const minReach = Math.abs(upperArm - forearm) + PersonArmUtil.MIN_REACH_MARGIN;
    if (distance > maxReach) {
      deltaX *= maxReach / distance;
      deltaY *= maxReach / distance;
      distance = maxReach;
    }
    if (distance < minReach) {
      distance = minReach;
    }
    const spread = Math.acos((upperArm ** 2 + distance ** 2 - forearm ** 2) / (2 * upperArm * distance));
    const direction = Math.atan2(deltaY, deltaX);
    const first: Point = [
      shoulder[0] + upperArm * Math.cos(direction + spread),
      shoulder[1] + upperArm * Math.sin(direction + spread),
    ];
    const second: Point = [
      shoulder[0] + upperArm * Math.cos(direction - spread),
      shoulder[1] + upperArm * Math.sin(direction - spread),
    ];
    const elbowDown = first[1] > second[1] ? first : second;
    const elbowOut = side * first[0] > side * second[0] ? first : second;
    const bendToElbow: Record<BendName, Point> = { down: elbowDown, out: elbowOut };
    return { elbow: bendToElbow[bend], hand: [shoulder[0] + deltaX, shoulder[1] + deltaY] };
  }

  static hand(position: Point, skin: string, isOpen: boolean, elbow: Point): string {
    const round = (value: number): number => PersonArmUtil.round(value);
    const deltaX = position[0] - elbow[0];
    const deltaY = position[1] - elbow[1];
    const angle = (Math.atan2(deltaY, deltaX) * PersonArmUtil.HALF_TURN_DEGREES) / Math.PI;
    const normal = [-deltaY, deltaX];
    const toBody = [-position[0], PersonArmUtil.BODY_CENTER_Y - position[1]];
    // Why: the thumb goes on the side that points toward the body center.
    const thumbSide = (normal[0] ?? 0) * (toBody[0] ?? 0) + (normal[1] ?? 0) * (toBody[1] ?? 0) >= 0 ? 1 : -1;
    const shade = ColorUtil.sh(skin, -0.12);
    const placement = `translate(${round(position[0])} ${round(position[1])}) rotate(${round(angle)})`;
    const wrap = (inner: string): string => `<g transform="${placement}">${inner}</g>`;
    // Why: the hand is a fist (palm and thumb) or open (palm, fanned fingers and thumb), oriented by the forearm.
    if (!isOpen) {
      return wrap(`<ellipse cx="1.2" cy="${0.9 * thumbSide}" rx="1.9" ry="1.3" fill="${shade}" `
        + `transform="rotate(${-30 * thumbSide} 1.2 ${0.9 * thumbSide})"/>`
        + `<path d="M-1.2 -2.9 L3 -3.2 Q6.6 -3.1 6.6 0 Q6.6 3.1 3 3.2 L-1.2 2.9 Z" fill="${skin}"/>`
        + `<ellipse cx="2.4" cy="${2.6 * thumbSide}" rx="2.2" ry="1.25" fill="${skin}" `
        + `transform="rotate(${-20 * thumbSide} 2.4 ${2.6 * thumbSide})"/>`
        + `<path d="M4.2 -1.6 L4.2 1.6" stroke="${shade}" stroke-width="0.6" stroke-linecap="round"/>`);
    }
    const fingers = PersonArmUtil.FINGER_ANGLES.map((fingerAngle, index) => {
      const length = PersonArmUtil.FINGER_LENGTHS[index] ?? 0;
      const radians = (fingerAngle * Math.PI) / PersonArmUtil.HALF_TURN_DEGREES;
      return `<path d="M3 ${round(Math.sin(radians) * 1.9)} L${round(3 + Math.cos(radians) * length)} `
        + `${round(Math.sin(radians) * (1.9 + length))}" stroke="${skin}" stroke-width="2.25" stroke-linecap="round"/>`;
    }).join("");
    return wrap(`<ellipse cx="1.3" cy="0" rx="3.7" ry="3.5" fill="${skin}"/>${fingers}`
      + `<path d="M0.6 ${2.2 * thumbSide} L1.8 ${5 * thumbSide}" stroke="${skin}" stroke-width="2.3" stroke-linecap="round"/>`);
  }

  static taper(points: Point[], widths: number[], color: string): string {
    const round = (value: number): number => PersonArmUtil.round(value);
    const last = points.length - 1;
    const sides = points.map((point, index) => {
      const before = points[Math.max(0, index - 1)] ?? point;
      const after = points[Math.min(last, index + 1)] ?? point;
      const length = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1;
      const normal: Point = [-(after[1] - before[1]) / length, (after[0] - before[0]) / length];
      const segmentFrom = index === last ? points[index - 1] ?? point : point;
      const segmentTo = index === last ? point : points[index + 1] ?? point;
      const segmentLength = Math.hypot(segmentTo[0] - segmentFrom[0], segmentTo[1] - segmentFrom[1]) || 1;
      const segmentNormal: Point = [
        -(segmentTo[1] - segmentFrom[1]) / segmentLength, (segmentTo[0] - segmentFrom[0]) / segmentLength,
      ];
      // Why: at a bend the offset grows by 1 / cos(half-angle) so the limb keeps its width through the elbow.
      const dot = normal[0] * segmentNormal[0] + normal[1] * segmentNormal[1];
      const miter = Math.min(PersonArmUtil.MAX_MITER, 1 / Math.max(PersonArmUtil.MIN_MITER_DOT, dot));
      const half = ((widths[index] ?? widths.at(-1) ?? 1) / 2) * miter;
      return {
        left: [point[0] + normal[0] * half, point[1] + normal[1] * half] as Point,
        right: [point[0] - normal[0] * half, point[1] - normal[1] * half] as Point,
        radius: (widths[index] ?? widths.at(-1) ?? 1) / 2,
      };
    });
    const first = sides[0];
    const end = sides[last];
    if (!first || !end) {
      return "";
    }
    const along = sides.map((side) => `L${round(side.left[0])} ${round(side.left[1])}`).join("");
    const back = sides.map((side) => `L${round(side.right[0])} ${round(side.right[1])}`).reverse().join("");
    const cap = (radius: number, to: Point): string => `A${round(radius)} ${round(radius)} 0 0 0 ${round(to[0])} ${round(to[1])}`;
    return `<path d="M${round(first.left[0])} ${round(first.left[1])}${along}${cap(end.radius, end.right)}${back}`
      + `${cap(first.radius, first.left)}Z" fill="${color}"/>`;
  }

  private static foldOf(from: Point, to: Point, color: string): string {
    const round = (value: number): number => PersonArmUtil.round(value);
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
    const normal: Point = [-(to[1] - from[1]) / length, (to[0] - from[0]) / length];
    const half = PersonArmUtil.FOLD_HALF_WIDTH;
    return `<path d="M${round(to[0] + normal[0] * half)} ${round(to[1] + normal[1] * half)} `
      + `Q${round(to[0] + (to[0] - from[0]) / length)} ${round(to[1] + (to[1] - from[1]) / length)} `
      + `${round(to[0] - normal[0] * half)} ${round(to[1] - normal[1] * half)}" stroke="${color}" `
      + `stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
  }

  static armPath(
    shoulder: Point,
    arm: Arm,
    colors: { sleeve: string; skin: string },
    options: { isShortSleeve: boolean; hasFold: boolean },
  ): string {
    const { elbow, hand } = arm;
    const { isShortSleeve, hasFold } = options;
    const fold = hasFold ? PersonArmUtil.foldOf(shoulder, elbow, ColorUtil.sh(colors.sleeve, -PersonArmUtil.FOLD_SHADE)) : "";
    if (!isShortSleeve) {
      return PersonArmUtil.taper([shoulder, elbow, hand], PersonArmUtil.SLEEVE_WIDTHS, colors.sleeve) + fold;
    }
    const split = PersonArmUtil.SHORT_SLEEVE_SPLIT;
    const middle: Point = [
      shoulder[0] + (elbow[0] - shoulder[0]) * split,
      shoulder[1] + (elbow[1] - shoulder[1]) * split,
    ];
    return PersonArmUtil.taper([middle, elbow, hand], PersonArmUtil.SKIN_WIDTHS, colors.skin)
      + PersonArmUtil.taper([shoulder, middle], PersonArmUtil.SHORT_SLEEVE_WIDTHS, colors.sleeve);
  }
}
