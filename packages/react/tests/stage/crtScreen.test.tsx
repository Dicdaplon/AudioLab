import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { CrtScreen } from "../../src/stage/visuals/CrtScreen";

describe("CrtScreen", () => {
  it("frames the screen with a bezel, a brand and a power light", () => {
    const { container } = render(<CrtScreen x={48} y={48} w={640} h={360} tonic={9} live />);
    const root = container.firstElementChild as HTMLElement;
    // The casing sits 30 px around the screen, 52 px under it.
    expect(root.style.left).toBe("18px");
    expect(root.style.width).toBe(`${640 + 60}px`);
    expect(root.style.height).toBe(`${360 + 30 + 52}px`);
    expect(container.querySelector("svg path")).toBeTruthy();
    expect(container.textContent).toContain("loloup");
    expect(container.textContent).toContain("Tech");
  });

  it("can drop the scanlines, takes another brand, and renders on the server", () => {
    const html = renderToString(
      <CrtScreen x={0} y={0} w={320} h={180} scanlines={false} brand="Studio" />,
    );
    expect(html).toContain("Studio");
    expect(html).not.toContain("repeating-linear-gradient");
  });
});

describe("CrtScreen glass events", () => {
  it("plays one event now and then, and cleans up its timer", async () => {
    const { vi } = await import("vitest");
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0); // first event (glare), earliest time
    const { act } = await import("@testing-library/react");
    const { container, unmount } = render(<CrtScreen x={0} y={0} w={320} h={180} />);
    const glass = () => container.querySelectorAll("div[style*='animation']").length;
    const idle = glass();
    act(() => {
      vi.advanceTimersByTime(15001);
    });
    expect(glass()).toBe(idle + 1);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(glass()).toBe(idle);
    unmount();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
});
