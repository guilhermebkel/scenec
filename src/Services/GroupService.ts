import { WorkspaceGroup } from "@/Resources/Groups/WorkspaceGroup.ts";
import { ReadingCornerGroup } from "@/Resources/Groups/ReadingCornerGroup.ts";
import { DiningGroup } from "@/Resources/Groups/DiningGroup.ts";
import { ConversationGroup } from "@/Resources/Groups/ConversationGroup.ts";
import { ParkBenchGroup } from "@/Resources/Groups/ParkBenchGroup.ts";
import { CelebrationGroup } from "@/Resources/Groups/CelebrationGroup.ts";
import { MeetingGroup } from "@/Resources/Groups/MeetingGroup.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

import type { GroupPart } from "@/Protocols/GroupProtocol.ts";
import type { SceneObject } from "@/Protocols/SceneProtocol.ts";

export class GroupService {
  // Why: these are the keys that name another object, so a group has to prefix them with its own id.
  private static readonly REFERENCE_KEYS = [
    "left_of", "right_of", "behind", "in_front_of", "on", "under", "above", "holds", "look",
  ];

  private static readonly SIZE_NAME_TO_FACTOR: Record<string, number> = {
    tiny: 0.5, small: 0.75, medium: 1, large: 1.3, huge: 1.7,
  };

  private static readonly FACING_TO_OPPOSITE: Record<string, string> = { left: "right", right: "left" };

  static readonly GROUPS: Record<string, BaseGroup> = Object.fromEntries(
    [new WorkspaceGroup(), new ReadingCornerGroup(), new DiningGroup(), new ConversationGroup(), new ParkBenchGroup(), new CelebrationGroup(), new MeetingGroup()].map((group) => [group.id, group]),
  );

  static expandGroups(objects: Record<string, SceneObject>, warnings: string[]): Record<string, SceneObject> {
    const expanded: Record<string, SceneObject> = {};
    const groupIdToAnchorId: Record<string, string> = {};
    for (const [id, object] of Object.entries(objects)) {
      if (!object.group) {
        expanded[id] = object;
        continue;
      }
      const group = GroupService.GROUPS[object.group];
      if (!group) {
        const available = Object.keys(GroupService.GROUPS).join(", ");
        warnings.push(`group '${object.group}' (in '${id}') does not exist; available: ${available}`);
        continue;
      }
      const { parts, removed } = GroupService.buildParts(group, object);
      for (const [partId, part] of Object.entries(parts)) {
        // Why: a placed part has the same shape as a scene object, so the compiler can treat both alike.
        expanded[`${id}_${partId}`] = GroupService.placePart(part, { groupId: id, parts, removed, object }) as SceneObject;
      }
      groupIdToAnchorId[id] = `${id}_${group.anchor}`;
    }
    GroupService.pointReferencesAtAnchors(expanded, groupIdToAnchorId);
    return expanded;
  }

  private static buildParts(group: BaseGroup, object: SceneObject): { parts: Record<string, GroupPart>; removed: Set<string> } {
    const parts = group.build({ ...object, at: object.at ?? 0.5 });
    const removed = new Set<string>();
    for (const [partId, override] of Object.entries(object.parts ?? {})) {
      if (override === false) {
        delete parts[partId];
        removed.add(partId);
      } else {
        parts[partId] = { ...parts[partId], ...override };
      }
    }
    return { parts, removed };
  }

  private static placePart(
    part: GroupPart,
    context: { groupId: string; parts: Record<string, GroupPart>; removed: Set<string>; object: SceneObject },
  ): GroupPart {
    const { groupId, parts, removed, object } = context;
    const prefixed = (reference: unknown): unknown => {
      if (typeof reference === "string" && parts[reference]) {
        return `${groupId}_${reference}`;
      }
      return typeof reference === "string" && removed.has(reference) ? undefined : reference;
    };
    const placed: GroupPart = { ...part };
    for (const key of GroupService.REFERENCE_KEYS) {
      const reference = placed[key];
      if (reference != null) {
        placed[key] = Array.isArray(reference) ? reference.map(prefixed) : prefixed(reference);
      }
    }
    GroupService.deleteUndefined(placed);
    if (object.depth && !placed.on && !placed.depth) {
      placed.depth = object.depth;
    }
    if (object.size != null && !placed.on && !placed.holds) {
      placed.size = GroupService.sizeFactor(placed.size) * GroupService.sizeFactor(object.size);
    }
    if (object.flip) {
      GroupService.flip(placed);
    }
    return placed;
  }

  private static sizeFactor(size: unknown): number {
    if (typeof size === "number") {
      return size;
    }
    return GroupService.SIZE_NAME_TO_FACTOR[String(size)] ?? 1;
  }

  private static flip(part: GroupPart): void {
    if (part.left_of || part.right_of) {
      [part.left_of, part.right_of] = [part.right_of, part.left_of];
    }
    part.facing = GroupService.opposite(part.facing);
    part.align = typeof part.align === "number" ? -part.align : GroupService.opposite(part.align);
    if (typeof part.offset === "number") {
      part.offset = -part.offset;
    }
    GroupService.deleteUndefined(part);
    for (const key of ["facing", "align"]) {
      if (part[key] == null) {
        delete part[key];
      }
    }
  }

  private static opposite(side: unknown): unknown {
    return typeof side === "string" ? GroupService.FACING_TO_OPPOSITE[side] ?? side : side;
  }

  private static deleteUndefined(part: GroupPart): void {
    for (const key of Object.keys(part)) {
      if (part[key] === undefined) {
        delete part[key];
      }
    }
  }

  private static pointReferencesAtAnchors(expanded: Record<string, SceneObject>, groupIdToAnchorId: Record<string, string>): void {
    for (const part of Object.values(expanded)) {
      const fields: GroupPart = part;
      for (const key of GroupService.REFERENCE_KEYS) {
        const reference = fields[key];
        if (typeof reference === "string" && groupIdToAnchorId[reference]) {
          fields[key] = groupIdToAnchorId[reference];
        }
      }
    }
  }
}
