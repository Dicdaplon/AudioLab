"use client";

import { useState } from "react";

import { applyTheme, resolveTheme, type Theme } from "../ui/theme";

const GLYPH: Record<Theme, string> = { dark: "☾", light: "☀" };
const LABEL: Record<Theme, string> = { dark: "Dark", light: "Light" };

/**
 * Explicit theme choice, persisted. The visible text names the current
 * theme (like the book's toggle); the hidden suffix completes the
 * accessible name with the action.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme());
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button type="button" className="btn btn--quiet theme-toggle" onClick={toggle}>
      <span aria-hidden="true">{GLYPH[theme]}</span>
      <span className="theme-toggle__word">{LABEL[theme]}</span>
      <span className="visually-hidden"> — switch to the {next} theme</span>
    </button>
  );
}
