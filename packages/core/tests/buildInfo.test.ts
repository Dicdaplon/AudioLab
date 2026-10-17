import { describe, expect, it } from "vitest";

import { BUILD_INFO } from "../src";

describe("BUILD_INFO", () => {
  it("reads dev from the sources (the stamp is only defined by the build)", () => {
    expect(BUILD_INFO).toEqual({ version: "dev", commit: "dev" });
  });
});
