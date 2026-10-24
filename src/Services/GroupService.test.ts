import { GroupService } from "@/Services/GroupService.ts";
import { describe, expect, it } from "vitest";
import { GROUP_IDS } from "@/Protocols/GroupProtocol.ts";

describe("GroupService", () => {
  it("registers exactly the groups named in GROUP_IDS", () => {
    expect(Object.keys(GroupService.GROUPS).sort()).toEqual([...GROUP_IDS].sort());
  });
});

describe("GroupService.expandGroups()", () => {
  describe("when an object names a group", () => {
    it("creates one object per part with the group id as a prefix", () => {
      const objects = GroupService.expandGroups({ desk: { group: "workspace", at: 0.4 } }, []);

      expect(Object.keys(objects)).toStrictEqual([
        "desk_mesa", "desk_cadeira", "desk_pessoa", "desk_tela", "desk_luminaria", "desk_caneca", "desk_planta",
      ]);
    });

    it("rewrites the references between parts to the prefixed ids", () => {
      const objects = GroupService.expandGroups({ desk: { group: "workspace", at: 0.4 } }, []);

      expect(objects.desk_cadeira).toStrictEqual({ asset: "chair", left_of: "desk_mesa", gap: -0.04, facing: "right" });
    });

    it("places the anchor part where the group was placed", () => {
      const objects = GroupService.expandGroups({ desk: { group: "workspace", at: 0.4 } }, []);

      expect(objects.desk_mesa).toStrictEqual({ asset: "desk", at: 0.4 });
    });

    it("points a reference to the group id at the anchor part", () => {
      const objects = GroupService.expandGroups({ desk: { group: "workspace" }, cat: { asset: "cat", look: "desk" } }, []);

      expect(objects.cat).toStrictEqual({ asset: "cat", look: "desk_mesa" });
    });

    it("removes a part set to false and adjusts a part given as fields", () => {
      const objects = GroupService.expandGroups({ desk: { group: "workspace", parts: { planta: false, caneca: { color: "primary" } } } }, []);

      expect([Object.keys(objects).includes("desk_planta"), objects.desk_caneca]).toStrictEqual([
        false,
        { asset: "cup", on: "desk_mesa", align: 0.12, color: "primary" },
      ]);
    });

    it("multiplies the size of parts that do not inherit scale and hands down the depth", () => {
      const objects = GroupService.expandGroups({ desk: { group: "workspace", size: "large", depth: "mid" } }, []);

      expect(objects.desk_mesa).toStrictEqual({ asset: "desk", at: 0.5, depth: "mid", size: 1.3 });
    });

    it("mirrors the group with flip: sides swap and facing turns around", () => {
      const objects = GroupService.expandGroups({ desk: { group: "workspace", flip: true } }, []);

      expect(objects.desk_cadeira).toStrictEqual({ asset: "chair", gap: -0.04, facing: "left", right_of: "desk_mesa" });
    });
  });

  describe("when the group does not exist", () => {
    it("warns with the available groups and creates nothing", () => {
      const warnings: string[] = [];
      const objects = GroupService.expandGroups({ corner: { group: "nope" } }, warnings);

      expect([objects, warnings]).toStrictEqual([
        {},
        ["group 'nope' (in 'corner') does not exist; available: workspace, reading_corner, dining, conversation, park_bench, celebration, meeting"],
      ]);
    });
  });

  it("keeps objects that are not groups as they are", () => {
    const objects = GroupService.expandGroups({ tree: { asset: "tree", at: "left" } }, []);

    expect(objects).toStrictEqual({ tree: { asset: "tree", at: "left" } });
  });
});
