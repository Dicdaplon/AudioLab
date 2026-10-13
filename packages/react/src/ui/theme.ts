/**
 * Theme contract shared with the inline script in index.html:
 *
 * - `<html data-theme="dark" | "light">` is the explicit choice and wins;
 * - without it the stylesheet follows `prefers-color-scheme`, dark by default;
 * - the choice is persisted under localStorage("theme").
 */

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme";

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/** Stored choice, or null when none is stored or storage is unavailable. */
export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** OS preference; dark unless the OS explicitly prefers light. */
export function systemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** The theme the page shows right now: explicit choice first, OS second. */
export function resolveTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (isTheme(explicit)) return explicit;
  return readStoredTheme() ?? systemTheme();
}

/** Apply an explicit choice to the document and persist it. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing or blocked site data: the choice lasts for the session.
  }
}
