import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

import { LoupeRoot, useLoupeRoot } from "../../src/LoupeRoot";
import { DEFAULT_VIZ_THEME, useVizTheme } from "../../src/ui/vizTheme";

describe("LoupeRoot", () => {
  afterEach(() => {
    cleanup();
    document.documentElement.style.removeProperty("--al-viz-signal");
  });

  it("renders the root class on the chosen element and keeps the host attributes", () => {
    const view = render(
      <LoupeRoot as="section" className="host" aria-label="lab">
        <p>inside</p>
      </LoupeRoot>,
    );
    const root = view.container.firstElementChild!;
    expect(root.tagName).toBe("SECTION");
    expect(root.className).toBe("loupe host");
    expect(root.getAttribute("aria-label")).toBe("lab");
    expect(root.textContent).toBe("inside");
  });

  it("gives the canvas theme the tokens of the nearest root, not of the document", async () => {
    document.documentElement.style.setProperty("--al-viz-signal", "#111111");
    const seen: string[] = [];
    function Probe() {
      const root = useLoupeRoot();
      const theme = useVizTheme();
      seen.push(`${root?.current?.className ?? "none"}:${theme.signal}`);
      return null;
    }
    const view = render(
      <LoupeRoot style={{ "--al-viz-signal": "#222222" } as React.CSSProperties}>
        <Probe />
      </LoupeRoot>,
    );
    await act(async () => {});
    expect(seen.at(-1)).toBe("loupe:#222222");
    view.unmount();

    // Without a root the document element is the fallback.
    render(<Probe />);
    await act(async () => {});
    expect(seen.at(-1)).toBe("none:#111111");
  });

  it("starts from the defaults so the first render never touches the DOM", () => {
    let first: string | null = null;
    function Probe() {
      const theme = useVizTheme();
      first ??= theme.signal;
      return null;
    }
    document.documentElement.style.setProperty("--al-viz-signal", "#333333");
    render(<Probe />);
    expect(first).toBe(DEFAULT_VIZ_THEME.signal);
  });
});
