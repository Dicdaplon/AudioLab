"use client";

import { useEffect, useState } from "react";

import { applyTheme, resolveTheme, type Theme } from "../ui/theme";

const GLYPH: Record<Theme, string> = { dark: "☾", light: "☀" };
const LABEL: Record<Theme, string> = { dark: "Dark", light: "Light" };

/**
 * Explicit theme choice, persisted. The visible text names the current
 * theme (like the book's toggle); the hidden suffix completes the
 * accessible name with the action.
 *
 * The theme is only known in the browser (`<html data-theme>`, storage, OS
 * preference), so the server and the first client render show the default
 * and an effect corrects it right after hydration.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const next: Theme = theme === "dark" ? "light" : "dark";

  useEffect(() => {
    setTheme(resolveTheme());
  }, []);

  const toggle = () => {
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button type="button" className="al-btn al-btn--quiet al-theme-toggle" onClick={toggle}>
      <span aria-hidden="true">{GLYPH[theme]}</span>
      <span className="al-theme-toggle__word">{LABEL[theme]}</span>
      <span className="al-visually-hidden"> — switch to the {next} theme</span>
    </button>
  );
}
