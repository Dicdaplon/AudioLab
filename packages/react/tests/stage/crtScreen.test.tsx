import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { CrtScreen } from "../../src/stage/visuals/CrtScreen";

describe("CrtScreen", () => {
  it("frames the screen with a bezel, a brand and a power light", () => {
    const { container } = render(<CrtScreen x={48} y={48} w={640} h={360} tonic={9} live />);
    const root = container.firstElementChild as HTMLElement;
    // The bezel sits 28 px around the screen, 44 px under it.
    expect(root.style.left).toBe("20px");
    expect(root.style.width).toBe(`${640 + 56}px`);
    expect(root.style.height).toBe(`${360 + 28 + 44}px`);
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
