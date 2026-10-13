import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { TabBar, type TabDef } from "../../src/components/TabBar";
import { panelId, tabId } from "../../src/ui/tabIds";

type Id = "a" | "b" | "c";
const TABS: ReadonlyArray<TabDef<Id>> = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c", label: "Gamma" },
];

function Harness({ onSelect }: { onSelect?: (id: Id) => void }) {
  const [active, setActive] = useState<Id>("a");
  return (
    <>
      <TabBar
        tabs={TABS}
        active={active}
        onSelect={(id) => {
          onSelect?.(id);
          setActive(id);
        }}
        label="Sections"
      />
      <section role="tabpanel" id={panelId(active)} aria-labelledby={tabId(active)}>
        {active}
      </section>
    </>
  );
}

describe("TabBar", () => {
  afterEach(cleanup);

  it("exposes the tab semantics and a single tab stop", () => {
    render(<Harness />);
    const list = screen.getByRole("tablist", { name: "Sections" });
    const tabs = screen.getAllByRole("tab");
    expect(list).toBeTruthy();
    expect(tabs).toHaveLength(3);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    expect(tabs[0].getAttribute("aria-controls")).toBe(panelId("a"));
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(tabs[0].id);
  });

  it("moves selection and focus with the arrow keys, wrapping at both ends", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    const list = screen.getByRole("tablist");
    const tab = (name: string) => screen.getByRole("tab", { name });

    tab("Alpha").focus();
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(onSelect).toHaveBeenLastCalledWith("b");
    expect(document.activeElement).toBe(tab("Beta"));
    expect(tab("Beta").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("b");

    fireEvent.keyDown(list, { key: "ArrowLeft" });
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tab("Gamma"));

    fireEvent.keyDown(list, { key: "Home" });
    expect(document.activeElement).toBe(tab("Alpha"));
    fireEvent.keyDown(list, { key: "End" });
    expect(document.activeElement).toBe(tab("Gamma"));
  });

  it("selects on click", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Gamma" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("c");
  });
});
