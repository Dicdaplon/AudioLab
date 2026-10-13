import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WolfSprite } from "../../src/games/wolf-jumper/WolfSprite";
import { WOLF_ASPECT, WOLF_PATHS } from "../../src/games/wolf-jumper/wolfArt";

describe("WolfSprite", () => {
  it("draws every path in source order with its role class", () => {
    const { container } = render(<WolfSprite width={100} />);
    const paths = [...container.querySelectorAll("path")];
    expect(paths).toHaveLength(WOLF_PATHS.length);
    paths.forEach((p, i) => expect(p.getAttribute("class")).toBe(`al-wolf__${WOLF_PATHS[i].role}`));
  });

  it("has exactly one ember eye and starts with the solid ink outline", () => {
    expect(WOLF_PATHS.filter((p) => p.role === "eye")).toHaveLength(1);
    expect(WOLF_PATHS[0].role).toBe("ink");
  });

  it("keeps the artwork aspect ratio and stays decorative", () => {
    const { container } = render(<WolfSprite width={200} />);
    const svg = container.querySelector("svg")!;
    expect(Number(svg.getAttribute("height"))).toBeCloseTo(200 * WOLF_ASPECT);
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });
});
