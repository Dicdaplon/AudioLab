import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { HowPanel } from "../../src/components/HowPanel";
import {
  SketchBars,
  SketchChain,
  SketchCurve,
  SketchLabel,
  SketchMeter,
  SketchTimeline,
  SketchWave,
} from "../../src/sketch/Sketch";

describe("HowPanel", () => {
  afterEach(cleanup);

  it("is a closed disclosure with the topic, opening onto the idea and the facts", () => {
    const { container } = render(
      <HowPanel
        topic="finding the key"
        diagram={<SketchLabel text="C" sub="major" />}
        algorithm="Krumhansl–Schmuckler."
        limits="Relative keys tie."
        sources={[{ label: "Krumhansl 1990" }, { label: "Web", url: "https://example.org" }]}
        aside="Human ears as a template."
      >
        <p>A key is a family of notes.</p>
      </HowPanel>,
    );
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    expect(screen.getByText("How?")).toBeTruthy();
    expect(screen.getByText("finding the key")).toBeTruthy();
    const terms = Array.from(container.querySelectorAll("dt"), (d) => d.textContent);
    expect(terms).toEqual(["Algorithm", "Limits", "From", "Worth knowing"]);
    const link = screen.getByRole("link", { name: "Web" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
    expect(container.querySelector(".al-how__diagram svg")).not.toBeNull();
  });

  it("can start open, with a custom title and only the facts given", () => {
    const { container } = render(
      <HowPanel topic="x" title="Comment ?" defaultOpen className="mine">
        idea
      </HowPanel>,
    );
    const details = container.querySelector("details")!;
    expect(details.open).toBe(true);
    expect(details.className).toBe("al-how mine");
    expect(screen.getByText("Comment ?")).toBeTruthy();
    expect(container.querySelectorAll("dt")).toHaveLength(0);
    expect(container.querySelector(".al-how__diagram")).toBeNull();
  });
});

describe("Sketch primitives", () => {
  afterEach(cleanup);

  it("draw decorative SVGs, or labelled images when given a label", () => {
    const { container } = render(
      <div>
        <SketchWave kind="pluck" />
        <SketchWave kind="noise" />
        <SketchWave kind="click" label="a click" />
        <SketchBars
          values={[0.2, 1.4, 0.5]}
          highlight={[1]}
          threshold={0.5}
          labels={["a", "b", "c"]}
        />
        <SketchCurve
          points={[
            [0, 0],
            [0.5, 1],
            [1, 0],
          ]}
          marks={[0.5]}
          dashed={[
            [0, 0.5],
            [1, 0.5],
          ]}
        />
        <SketchTimeline targets={[0.3]} dots={[0.32]} band={0.1} beats={[0.3]} wide />
        <SketchMeter level={0.6} floor={0.2} threshold={0.4} />
        <SketchLabel text="110 Hz" />
      </div>,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(8);
    expect(svgs[2].getAttribute("role")).toBe("img");
    expect(svgs[2].getAttribute("aria-label")).toBe("a click");
    expect(svgs[0].getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelectorAll(".al-sketch__bar--on")).toHaveLength(2); // bar + timeline target
    expect(container.querySelector(".al-sketch__threshold")).not.toBeNull();
    expect(container.querySelector(".al-sketch__dot")).not.toBeNull();
    expect(svgs[5].getAttribute("viewBox")).toBe("0 0 200 64");
  });

  it("chains sketches with arrows and captions", () => {
    const { container } = render(
      <SketchChain
        label="sound to key"
        items={[
          { sketch: <SketchWave />, caption: "sound" },
          { sketch: <SketchLabel text="C" />, caption: "key", wide: true },
        ]}
      />,
    );
    const figure = container.querySelector("figure")!;
    expect(figure.getAttribute("aria-label")).toBe("sound to key");
    expect(container.querySelectorAll(".al-sketch-chain__arrow")).toHaveLength(1);
    expect(
      Array.from(container.querySelectorAll(".al-sketch-chain__caption"), (c) => c.textContent),
    ).toEqual(["sound", "key"]);
    expect(container.querySelectorAll(".al-sketch-chain__step--wide")).toHaveLength(1);
  });
});
