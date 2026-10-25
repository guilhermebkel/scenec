import { WorkspaceGroup } from "@/Resources/Groups/WorkspaceGroup.ts";
import { ReadingCornerGroup } from "@/Resources/Groups/ReadingCornerGroup.ts";
import { DiningGroup } from "@/Resources/Groups/DiningGroup.ts";
import { ConversationGroup } from "@/Resources/Groups/ConversationGroup.ts";
import { ParkBenchGroup } from "@/Resources/Groups/ParkBenchGroup.ts";
import { CelebrationGroup } from "@/Resources/Groups/CelebrationGroup.ts";
import { MeetingGroup } from "@/Resources/Groups/MeetingGroup.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

import { GROUP_IDS, type GroupId, type GroupPart } from "@/Protocols/GroupProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { RegistryUtil } from "@/Utils/RegistryUtil.ts";
import type { Facing } from "@/Protocols/AssetProtocol.ts";
import type { SceneObject, SizeName } from "@/Protocols/SceneProtocol.ts";

export class GroupService {
  // Why: these are the keys that name another object, so a group has to prefix them with its own id.
  private static readonly REFERENCE_KEYS: readonly (keyof GroupPart)[] = [
    "left_of", "right_of", "behind", "in_front_of", "on", "under", "above", "holds", "look",
  ];

  private static readonly SIZE_NAME_TO_FACTOR: Record<SizeName, number> = {
    tiny: 0.5, small: 0.75, medium: 1, large: 1.3, huge: 1.7,
  };

  private static readonly FACING_TO_OPPOSITE: Record<Facing, Facing> = { left: "right", right: "left" };

  static readonly GROUP_ID_TO_GROUP: Record<GroupId, BaseGroup> = RegistryUtil.indexById(
    [
      new WorkspaceGroup(), new ReadingCornerGroup(), new DiningGroup(), new ConversationGroup(),
      new ParkBenchGroup(), new CelebrationGroup(), new MeetingGroup(),
    ],
  );

  static expandGroups(
    idToObject: Record<string, SceneObject>, warnings: string[],
  ): Record<string, SceneObject> {
    const idToExpanded: Record<string, SceneObject> = {};
    const groupIdToAnchorId: Record<string, string> = {};
    for (const [id, object] of Object.entries(idToObject)) {
      if (!object.group) {
        idToExpanded[id] = object;
        continue;
      }
      const group = IdUtil.isOneOf(GROUP_IDS, object.group) ? GroupService.GROUP_ID_TO_GROUP[object.group] : undefined;
      if (!group) {
        const available = Object.keys(GroupService.GROUP_ID_TO_GROUP).join(", ");
        warnings.push(`group '${object.group}' (in '${id}') does not exist; available: ${available}`);
        continue;
      }
      const { partIdToPart, removed } = GroupService.buildParts(group, object);
      for (const [partId, part] of Object.entries(partIdToPart)) {
        idToExpanded[`${id}_${partId}`] = GroupService.placePart(part, { groupId: id, partIdToPart, removed, object });
      }
      groupIdToAnchorId[id] = `${id}_${group.anchor}`;
    }
    GroupService.pointReferencesAtAnchors(idToExpanded, groupIdToAnchorId);
    return idToExpanded;
  }

  private static buildParts(
    group: BaseGroup, object: SceneObject,
  ): { partIdToPart: Record<string, GroupPart>; removed: Set<string> } {
    const partIdToPart = group.build({ ...object, at: object.at ?? 0.5 });
    const removed = new Set<string>();
    for (const [partId, override] of Object.entries(object.parts ?? {})) {
      if (override === false) {
        Reflect.deleteProperty(partIdToPart, partId);
        removed.add(partId);
      } else {
        partIdToPart[partId] = { ...partIdToPart[partId], ...override };
      }
    }
    return { partIdToPart, removed };
  }

  private static placePart(
    part: GroupPart,
    context: { groupId: string; partIdToPart: Record<string, GroupPart>; removed: Set<string>; object: SceneObject },
  ): GroupPart {
    const { groupId, partIdToPart, removed, object } = context;
    const prefixed = (reference: unknown): unknown => {
      if (typeof reference === "string" && partIdToPart[reference]) {
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
    return IdUtil.lookup(GroupService.SIZE_NAME_TO_FACTOR, size) ?? 1;
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
        Reflect.deleteProperty(part, key);
      }
    }
  }

  private static opposite(side: unknown): unknown {
    return IdUtil.lookup(GroupService.FACING_TO_OPPOSITE, side) ?? side;
  }

  private static deleteUndefined(part: GroupPart): void {
    for (const key of Object.keys(part)) {
      if (part[key] === undefined) {
        Reflect.deleteProperty(part, key);
      }
    }
  }

  private static pointReferencesAtAnchors(
    idToExpanded: Record<string, SceneObject>, groupIdToAnchorId: Record<string, string>,
  ): void {
    for (const part of Object.values(idToExpanded)) {
      const fields: Record<string, unknown> = part;
      for (const key of GroupService.REFERENCE_KEYS) {
        const reference = fields[key];
        if (typeof reference === "string" && groupIdToAnchorId[reference]) {
          fields[key] = groupIdToAnchorId[reference];
        }
      }
    }
  }
}
