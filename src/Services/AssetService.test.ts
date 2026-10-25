import { describe, expect, it } from "vitest";
import { ASSET_IDS } from "@/Protocols/AssetProtocol.ts";
import { AssetService } from "@/Services/AssetService.ts";

describe("AssetService.resolveAsset()", () => {
  it("registers exactly the assets named in ASSET_IDS", () => {
    expect(Object.keys(AssetService.ASSET_ID_TO_ASSET).sort()).toStrictEqual([...ASSET_IDS].sort());
  });

  it("resolves a synonym to its asset id", () => {
    expect(AssetService.resolveAsset("man").id).toBe("person");
  });

  it("suggests close names for an unknown asset", () => {
    expect(AssetService.resolveAsset("perzon").suggest).toContain("person");
  });
});
