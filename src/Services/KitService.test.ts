import { describe, expect, it } from "vitest";
import { KIT_IDS } from "@/Protocols/KitProtocol.ts";
import { KitService } from "@/Services/KitService.ts";

describe("KitService", () => {
  it("registers exactly the kits named in KIT_IDS", () => {
    expect(Object.keys(KitService.KIT_ID_TO_KIT).sort()).toEqual([...KIT_IDS].sort());
  });
});
