import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ThemeToggle } from "../../src/components/ThemeToggle";
import { THEME_STORAGE_KEY, resolveTheme, systemTheme } from "../../src/ui/theme";

function stubPrefersLight(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("light") ? matches : !matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

describe("theme contract", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("defaults to dark when nothing is stored and the OS has no light preference", () => {
    stubPrefersLight(false);
    expect(systemTheme()).toBe("dark");
    expect(resolveTheme()).toBe("dark");
  });

  it("follows the OS when it prefers light and nothing is stored", () => {
    stubPrefersLight(true);
    expect(resolveTheme()).toBe("light");
  });

  it("lets the stored choice win over the OS preference", () => {
    stubPrefersLight(true);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(resolveTheme()).toBe("dark");
  });

  it("toggles the document attribute and persists the choice", () => {
    stubPrefersLight(false);
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.textContent).toMatch(/Dark/);
    expect(button.textContent).toMatch(/switch to the light theme/);

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(button.textContent).toMatch(/Light/);

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("starts from the stored theme after a reload", () => {
    stubPrefersLight(false);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    render(<ThemeToggle />);
    expect(screen.getByRole("button").textContent).toMatch(/Light/);
  });
});
