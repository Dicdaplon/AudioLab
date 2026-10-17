import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import * as art from "@audiolab/react/art";

describe("@audiolab/react/art", () => {
  it("exports the wolf artwork as plain data", () => {
    expect(Object.keys(art).sort()).toEqual([
      "WOLF_ASPECT",
      "WOLF_PATHS",
      "WOLF_TRANSFORM",
      "WOLF_VIEWBOX",
    ]);
    expect(art.WOLF_PATHS.length).toBeGreaterThan(0);
    expect(art.WOLF_PATHS.every((p) => typeof p.d === "string")).toBe(true);
  });

  it("is not a client module and imports nothing", () => {
    const files = ["../../src/art.ts", "../../src/games/wolf-jumper/wolfArt.ts"];
    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      expect(source).not.toMatch(/^["']use client["']/m);
      expect(source.replace(/from "\.\/games\/wolf-jumper\/wolfArt"/, "")).not.toMatch(/from "/);
    }
  });
});
