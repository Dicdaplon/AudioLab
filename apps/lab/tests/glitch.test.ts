import { describe, expect, it } from "vitest";

import { glitch } from "../src/terminal/glitch";

describe("glitch", () => {
  const text = "CORE ONLINE.\nThe Triad Algorithm led the way.";

  it("leaves the text alone at rate 0", () => {
    expect(glitch(text, 0)).toBe(text);
  });

  it("scars the same reply the same way every time", () => {
    expect(glitch(text, 0.2, 7)).toBe(glitch(text, 0.2, 7));
    expect(glitch(text, 0.2, 7)).not.toBe(text);
  });

  it("keeps the line breaks", () => {
    expect(glitch(text, 1, 3).split("\n")).toHaveLength(2);
  });
});
