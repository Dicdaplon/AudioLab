import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

import { eventsFromDurations } from "@audiolab/core/rhythm";
import { StaffNotation } from "../../src/components/StaffNotation";

describe("StaffNotation", () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const runFrame = () => act(() => frames.splice(0).forEach((cb) => cb(0)));

  it("writes a rhythm on one line: heads, beams, rests, dots, bars and the count", () => {
    const events = eventsFromDurations([1.5, 0.5, 0.5, 0.5, -1, 1, 1, 2]);
    const { container } = render(
      <StaffNotation
        events={events}
        count
        states={["onTime", "early", "late", "missed", undefined, "onTime", "pending", undefined]}
      />,
    );
    const root = container.querySelector(".al-staff")!;
    expect(root.getAttribute("role")).toBe("img");
    expect(root.getAttribute("aria-label")).toMatch(
      /^dotted quarter, eighth, eighth, eighth, quarter rest/,
    );
    expect(container.querySelectorAll(".al-staff__system")).toHaveLength(1);
    expect(container.querySelectorAll(".al-staff__line")).toHaveLength(1);
    expect(container.querySelectorAll(".al-staff__head")).toHaveLength(7);
    expect(container.querySelectorAll(".al-staff__head--hollow")).toHaveLength(1);
    expect(container.querySelectorAll(".al-staff__dot-value")).toHaveLength(1);
    // The eighths at 2 and 2.5 share a beam; the one at 1.5 keeps its flag.
    expect(container.querySelectorAll(".al-staff__beam")).toHaveLength(1);
    expect(container.querySelectorAll(".al-staff__flag")).toHaveLength(1);
    expect(container.querySelectorAll(".al-staff__rest")).toHaveLength(1);
    expect(container.querySelectorAll(".al-staff__bar")).toHaveLength(2);
    expect(container.querySelectorAll('.al-staff__note[data-state="early"]')).toHaveLength(1);
    const count = Array.from(container.querySelectorAll(".al-staff__count"), (t) => t.textContent);
    expect(count.slice(0, 4)).toEqual(["1", "&", "2", "&"]);
    expect(count).toHaveLength(16);
  });

  it("writes a melody on a treble staff, with ledger lines and sharps, and chord symbols", () => {
    const events = eventsFromDurations([1, 1, 1, 1]);
    const { container } = render(
      <StaffNotation
        events={events}
        pitches={[40, 61, 64, 81]}
        symbols={["Em", undefined, "C", "A"]}
      />,
    );
    expect(container.querySelectorAll(".al-staff__line")).toHaveLength(5);
    expect(container.querySelector(".al-staff__clef")).not.toBeNull();
    // E2 written E3: three ledgers below; A5 written A6: ledgers above.
    expect(container.querySelectorAll(".al-staff__ledger").length).toBeGreaterThanOrEqual(5);
    expect(container.querySelectorAll(".al-staff__accidental")).toHaveLength(1); // C#
    expect(
      Array.from(container.querySelectorAll(".al-staff__symbol"), (s) => s.textContent),
    ).toEqual(["Em", "C", "A"]);
  });

  it("wraps long rhythms and moves the cursor and dots without re-rendering", () => {
    const events = eventsFromDurations(Array.from({ length: 24 }, () => 1));
    let beat: number | null = 13.5;
    const { container } = render(
      <StaffNotation
        events={events}
        barsPerLine={4}
        cursor={() => beat}
        dots={() => [{ beat: 2 }, { beat: 17, echo: true }]}
      />,
    );
    const systems = container.querySelectorAll(".al-staff__system");
    expect(systems).toHaveLength(2);
    runFrame();
    const cursors = container.querySelectorAll<SVGLineElement>(".al-staff__cursor");
    expect(cursors[0].style.opacity).toBe("1");
    expect(cursors[1].style.opacity).toBe("0");
    expect(systems[0].querySelectorAll(".al-staff__dot")).toHaveLength(1);
    expect(systems[1].querySelectorAll(".al-staff__dot--echo")).toHaveLength(1);
    beat = 18;
    runFrame();
    expect(cursors[0].style.opacity).toBe("0");
    expect(cursors[1].style.opacity).toBe("1");
  });
});
