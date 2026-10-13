import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ChromaBars } from "../../src/components/ChromaBars";
import { RankList } from "../../src/components/RankList";
import { Readout } from "../../src/components/Readout";
import { keyRows, splitKeyName } from "../../src/ui/rankRows";

describe("Readout", () => {
  afterEach(cleanup);

  it("shows the waiting state without a mode tint", () => {
    const view = render(<Readout label="Estimated key" meta="30 s" value={null} mode="maj" />);
    const readout = view.container.querySelector(".readout")!;
    expect(readout.getAttribute("data-mode")).toBeNull();
    expect(readout.textContent).toContain("Waiting for signal…");
  });

  it("prints the value, the mode word and the confidence segments", () => {
    const view = render(
      <Readout label="Estimated key" value="G" qualifier="major" mode="maj" probability={0.412} />,
    );
    const readout = view.container.querySelector(".readout")!;
    expect(readout.getAttribute("data-mode")).toBe("maj");
    expect(view.container.querySelector(".readout__value")?.textContent).toBe("G major");
    expect(readout.textContent).toContain("41.2 %");
    // 41.2 % → 2 of 5 segments.
    expect(screen.getByRole("img", { name: "confidence 2 of 5" })).toBeTruthy();
    expect(view.container.querySelectorAll(".segments__seg[data-filled]")).toHaveLength(2);
  });
});

describe("RankList", () => {
  afterEach(cleanup);

  it("marks the first row as current and tints rows by mode", () => {
    const rows = keyRows(
      [
        {
          tonic: 7,
          mode: "maj",
          name: "G major",
          shortName: "G",
          correlation: 0.83,
          probability: 0.41,
        },
        {
          tonic: 4,
          mode: "min",
          name: "E minor",
          shortName: "Em",
          correlation: 0.8,
          probability: 0.3,
        },
      ],
      5,
    );
    const view = render(<RankList rows={rows} label="Keys" />);
    const items = view.container.querySelectorAll(".ranklist__row");
    expect(items).toHaveLength(2);
    expect(items[0].getAttribute("aria-current")).toBe("true");
    expect(items[1].getAttribute("aria-current")).toBeNull();
    expect(items[0].getAttribute("data-mode")).toBe("maj");
    expect(items[1].getAttribute("data-mode")).toBe("min");
    expect(items[0].textContent).toContain("r=0.83");
    expect(items[0].querySelector<HTMLElement>(".ranklist__fill")?.style.width).toBe("41%");
  });

  it("splits a key name into tonic and mode", () => {
    expect(splitKeyName("F# minor")).toEqual({ tonic: "F#", mode: "minor" });
    expect(splitKeyName("Am")).toEqual({ tonic: "Am", mode: "" });
  });
});

describe("ChromaBars", () => {
  afterEach(cleanup);

  it("labels every pitch class, marks the strongest bar and the tonic", () => {
    const values = new Float32Array(12);
    values[2] = 0.5;
    values[9] = 1;
    const view = render(
      <ChromaBars values={values} label="chroma" tonic={2} colourByPitch={false} />,
    );
    expect(screen.getByRole("img", { name: "chroma, strongest A" })).toBeTruthy();
    const bars = view.container.querySelectorAll<HTMLElement>(".chroma__bar");
    expect(bars).toHaveLength(12);
    expect(Array.from(bars).map((b) => b.textContent)).toEqual([
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ]);
    expect(bars[9].hasAttribute("data-max")).toBe(true);
    expect(bars[2].hasAttribute("data-tonic")).toBe(true);
    expect(bars[2].style.getPropertyValue("--v")).toBe("0.500");
    expect(view.container.querySelector(".chroma")?.getAttribute("data-colour")).toBe("single");
  });

  it("switches to pitch-class colour on request", () => {
    const view = render(<ChromaBars values={new Float32Array(12)} label="chroma" colourByPitch />);
    expect(view.container.querySelector(".chroma")?.getAttribute("data-colour")).toBe("pitch");
    expect(screen.getByRole("img", { name: "chroma, strongest none" })).toBeTruthy();
  });
});
