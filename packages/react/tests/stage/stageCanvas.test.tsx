import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { StageCanvas, type StageFrame } from "../../src/stage/StageCanvas";
import { installCanvasStub, type CanvasRecorder } from "../helpers/canvasStub";

describe("StageCanvas", () => {
  let canvas: CanvasRecorder;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    canvas = installCanvasStub();
    frames = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    canvas.restore();
    vi.restoreAllMocks();
  });

  function step(ms: number) {
    const cb = frames.shift();
    cb?.(ms);
  }

  it("draws on every frame with the time, the step and the size", () => {
    const seen: StageFrame[] = [];
    const { container } = render(
      <StageCanvas
        width={320}
        height={160}
        draw={(_, f) => seen.push({ ...f })}
        label="Spectrum"
      />,
    );
    step(1000);
    step(1016);
    expect(seen[0]).toMatchObject({ now: 1, dt: 0, width: 320, height: 160, pixel: 1 });
    expect(seen[1].dt).toBeCloseTo(0.016);
    const el = container.querySelector("canvas")!;
    expect(el.width).toBe(320);
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Spectrum");
    expect(canvas.of("clearRect").length).toBeGreaterThan(0);
  });

  it("draws pixel art on a cell buffer scaled up without smoothing", () => {
    const seen: StageFrame[] = [];
    const { container } = render(
      <StageCanvas width={322} height={160} pixel={4} draw={(_, f) => seen.push({ ...f })} />,
    );
    step(0);
    step(500); // a long gap is capped
    expect(seen[0]).toMatchObject({ width: 81, height: 40, pixel: 4 });
    expect(seen[1].dt).toBe(0.1);
    expect(canvas.of("drawImage")).toHaveLength(2);
    expect(container.querySelector("canvas")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("stops its loop on unmount and uses the latest draw callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = render(<StageCanvas width={10} height={10} draw={first} />);
    rerender(<StageCanvas width={10} height={10} draw={second} />);
    step(0);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
