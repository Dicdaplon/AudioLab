"use client";

/**
 * The root of a Loupe subtree.
 *
 * Renders an element carrying the `loupe` class, which is where
 * `@audiolab/react/styles.css` defines every design token and from which
 * the canvas plots read their colours (`useVizTheme`). Mount one around the
 * SDK components of a page; nothing outside it is styled, and nothing from
 * the host document reaches inside except the theme contract
 * (`<html data-theme="dark" | "light">`, otherwise the OS preference).
 */

import { createContext, useContext, useRef, type HTMLAttributes, type RefObject } from "react";

export const LOUPE_ROOT_CLASS = "loupe";

const LoupeRootContext = createContext<RefObject<HTMLElement | null> | null>(null);

export interface LoupeRootProps extends HTMLAttributes<HTMLElement> {
  /** Element to render. Default "div". */
  as?: "div" | "section" | "main" | "article";
}

export function LoupeRoot({ as: Tag = "div", className, children, ...rest }: LoupeRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  const classes = className ? `${LOUPE_ROOT_CLASS} ${className}` : LOUPE_ROOT_CLASS;
  return (
    <LoupeRootContext.Provider value={ref}>
      <Tag ref={ref} className={classes} {...rest}>
        {children}
      </Tag>
    </LoupeRootContext.Provider>
  );
}

/**
 * The nearest `<LoupeRoot>` element, or null outside one. Code that reads
 * computed tokens falls back to `document.documentElement` when the host
 * put the `loupe` class there itself.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook next to its provider
export function useLoupeRoot(): RefObject<HTMLElement | null> | null {
  return useContext(LoupeRootContext);
}
