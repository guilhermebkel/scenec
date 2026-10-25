import type { Checkpoint, GroundSprite, PlaneLabel, PlaneWorld, ScreenBox } from "@/Protocols/PlaneProtocol.ts";
import type { LABEL_SIDES } from "@/Protocols/SceneProtocol.ts";
import { BoxUtil } from "@/Utils/BoxUtil.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { RequireUtil } from "@/Utils/RequireUtil.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";
import { ThemeUtil } from "@/Utils/ThemeUtil.ts";

type LabelSide = (typeof LABEL_SIDES)[number];

interface Others {
  blockers: readonly ScreenBox[];
  placed: readonly PlaneLabel[];
}

const FONT = "Poppins";

export class PlaneLabelService {
  private static readonly MIN_FONT = 13;

  private static readonly FRAME_MARGIN = 6;

  private static readonly OUT_OF_FRAME_PENALTY = 1e6;

  private static readonly TOLERATED_OVERLAP = 0.15;

  private static readonly BLOCKER_MIN_HEIGHT = 40;

  private static readonly PERSON_REACH = 20;

  // Why: the candidate index each `label_side` moves to the front of the list.
  private static readonly SIDE_TO_CANDIDATE: Record<LabelSide, number> = { left: 2, right: 1, below: 5 };

  static place(world: PlaneWorld): PlaneLabel[] {
    const minHeight = PlaneLabelService.BLOCKER_MIN_HEIGHT;
    const isBlocking = (sprite: GroundSprite): boolean => !sprite.isDecor || sprite.height > minHeight;
    const blockers: ScreenBox[] = world.ground.filter(isBlocking).map((sprite) => sprite.bounds);
    const labels: PlaneLabel[] = [];
    world.road.checkpoints.forEach((checkpoint, index) => {
      if (checkpoint.label === undefined || checkpoint.label === "") {
        return;
      }
      const label = PlaneLabelService.placeOne(world, checkpoint, index, { blockers, placed: labels });
      labels.push(label);
    });
    return labels;
  }

  static draw(world: PlaneWorld, labels: readonly PlaneLabel[]): string {
    const { theme } = world;
    const num = FormatUtil.oneDecimal;
    return labels.map((label) => {
      const { box } = label;
      const anchorX = Math.min(Math.max(label.centerX, box.x0 + 8), box.x1 - 8);
      const anchorY = box.y1 < label.centerY ? box.y1 : box.y0;
      const boxWidth = box.x1 - box.x0;
      const boxHeight = box.y1 - box.y0;
      const middle = (box.y0 + box.y1) / 2;
      const textY = num(middle + label.fontSize * 0.36);
      const size = num(label.fontSize);
      const leader = SvgUtil.segment([anchorX, anchorY], [label.centerX, label.centerY]);
      const numberText = SvgUtil.escapeXml(label.number);
      const titleText = SvgUtil.escapeXml(label.title);
      const titleColor = theme.text === theme.paper ? theme.ink : theme.text;
      return `<path d="${leader}" stroke="${theme.ink}" stroke-width="1.5" opacity="0.45" stroke-dasharray="3 3"/>`
        + `<rect x="${num(box.x0 + 2)}" y="${num(box.y0 + 3)}" width="${num(boxWidth)}" height="${num(boxHeight)}" `
        + `rx="${num(boxHeight / 2)}" fill="${theme.ink}" opacity="0.15"/>`
        + `<rect x="${num(box.x0)}" y="${num(box.y0)}" width="${num(boxWidth)}" height="${num(boxHeight)}" `
        + `rx="${num(boxHeight / 2)}" fill="${theme.paper}"/>`
        + `<circle cx="${num(box.x0 + boxHeight / 2)}" cy="${num(middle)}" r="${num(boxHeight / 2 - 3)}" fill="${label.color}"/>`
        + `<text x="${num(box.x0 + boxHeight / 2)}" y="${textY}" font-family="${FONT}" font-weight="700" `
        + `font-size="${size}" fill="${theme.paper}" text-anchor="middle">${numberText}</text>`
        + `<text x="${num(box.x0 + boxHeight + label.fontSize * 0.35)}" y="${textY}" font-family="${FONT}" font-weight="600" `
        + `font-size="${size}" fill="${titleColor}">${titleText}</text>`;
    }).join("");
  }

  private static placeOne(world: PlaneWorld, checkpoint: Checkpoint, index: number, others: Others): PlaneLabel {
    const { blockers, placed } = others;
    const title = checkpoint.label ?? "";
    const { camera, theme, road } = world;
    const [groundX, groundZ] = checkpoint.at;
    const centerX = camera.screenX(groundX, groundZ);
    const centerY = camera.screenY(groundZ);
    const shrink = camera.shrink(groundZ);
    const fontSize = Math.max(PlaneLabelService.MIN_FONT, camera.height * 0.024 * (0.75 + 0.25 * shrink / 1));
    const number = checkpoint.isFinish ? "★" : String(index + 1);
    const width = `${number}  ${title}`.length * fontSize * 0.56 + fontSize * 1.4;
    const height = fontSize * 1.8;
    const nearEdge = camera.screenY(groundZ - road.checkpointRadius);
    const radiusY = (nearEdge - camera.screenY(groundZ + road.checkpointRadius)) / 2;
    const reach = PlaneLabelService.PERSON_REACH;
    const person = world.ground.find((sprite) => sprite.isPerson
      && Math.abs(sprite.screenX - centerX) < reach && Math.abs(sprite.screenY - centerY) < reach);
    const up = person ? person.height + fontSize * 0.6 : fontSize * 2.4;
    const corners: [number, number][] = [
      [centerX - width / 2, centerY - up - height],
      [centerX + radiusY * 2.2, centerY - height * 0.5],
      [centerX - radiusY * 2.2 - width, centerY - height * 0.5],
      [centerX + radiusY * 1.6, centerY - up * 0.7 - height],
      [centerX - radiusY * 1.6 - width, centerY - up * 0.7 - height],
      [centerX - width / 2, centerY + radiusY * 2],
    ];
    const preferred = IdUtil.lookup(PlaneLabelService.SIDE_TO_CANDIDATE, checkpoint.labelSide);
    if (preferred !== undefined) {
      corners.unshift(RequireUtil.defined(corners[preferred], "label candidate"));
    }
    let best: ScreenBox | null = null;
    let bestScore = Infinity;
    for (const [left, top] of corners) {
      const box: ScreenBox = { x0: left, x1: left + width, y0: top, y1: top + height };
      let score = 0;
      if (box.x0 < PlaneLabelService.FRAME_MARGIN || box.x1 > camera.width - PlaneLabelService.FRAME_MARGIN
        || box.y0 < PlaneLabelService.FRAME_MARGIN || box.y1 > camera.height - PlaneLabelService.FRAME_MARGIN) {
        score += PlaneLabelService.OUT_OF_FRAME_PENALTY;
      }
      for (const blocker of blockers) {
        score += BoxUtil.overlapArea(box, blocker);
      }
      for (const other of placed) {
        score += BoxUtil.overlapArea(box, other.box) * 3;
      }
      if (score < bestScore) {
        bestScore = score;
        best = box;
      }
    }
    if (bestScore > width * height * PlaneLabelService.TOLERATED_OVERLAP) {
      const percent = Math.round(bestScore / (width * height) * 100);
      world.warnings.push(`label '${title}' overlaps other elements (${percent}% of its area); adjust 'label_side' or the point position`);
    }
    return {
      box: RequireUtil.defined(best ?? undefined, "label position"), centerX, centerY, number, title, fontSize,
      color: checkpoint.isFinish ? theme.accent : ThemeUtil.resolve(theme, checkpoint.color, theme.primary),
    };
  }
}
