import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { SettingsRail } from "../../src/components/SettingsRail";
import { BREAKPOINTS, useMediaQuery } from "../../src/ui/useMediaQuery";

type Listener = () => void;

function stubMatchMedia(matching: Set<string>) {
  const listeners = new Map<string, Set<Listener>>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return matching.has(query);
      },
      media: query,
      addEventListener: (_: string, fn: Listener) => {
        if (!listeners.has(query)) listeners.set(query, new Set());
        listeners.get(query)!.add(fn);
      },
      removeEventListener: (_: string, fn: Listener) => listeners.get(query)?.delete(fn),
    })),
  );
  return (query: string) => listeners.get(query)?.forEach((fn) => fn());
}

describe("SettingsRail", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is a collapsed disclosure below the xl breakpoint", () => {
    stubMatchMedia(new Set());
    const view = render(
      <SettingsRail>
        <p>sliders</p>
      </SettingsRail>,
    );
    const details = view.container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details!.open).toBe(false);
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("becomes a sticky aside at xl and follows viewport changes", () => {
    const matching = new Set<string>();
    const fire = stubMatchMedia(matching);
    const view = render(
      <SettingsRail>
        <p>sliders</p>
      </SettingsRail>,
    );
    expect(view.container.querySelector("aside")).toBeNull();

    matching.add(BREAKPOINTS.xl);
    act(() => fire(BREAKPOINTS.xl));
    expect(view.container.querySelector("aside.rail")).not.toBeNull();
    expect(view.container.querySelector("details")).toBeNull();
  });

  it("reports false where matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    function Probe() {
      return <span>{String(useMediaQuery(BREAKPOINTS.md))}</span>;
    }
    render(<Probe />);
    expect(screen.getByText("false")).toBeTruthy();
  });
});
