/**
 * What the overlay shows (layout, timeline view, webcam frame, wolf,
 * optional layers), changed with single keys while live and remembered in
 * localStorage. A URL parameter, when present, sets the starting value of
 * its preference; the keys take it from there.
 *
 *   L layout · T timeline (frets ↔ names on a staff)
 *   W wolf · M mandala · P paw prints · E embers · A aurora · O oscilloscope
 *   K chord ribbon instead of the timeline
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { CRT_LOOKS, type CrtLook } from "@audiolab/react/stage";

import type { Extra, Layout, OverlayParams } from "./params";

const STORAGE_KEY = "audiolab-overlay-display";

export interface DisplayPrefs {
  layout: Layout;
  tabLabels: OverlayParams["tabLabels"];
  tabView: OverlayParams["tabView"];
  wolf: boolean;
  /** Frame of the webcam: an old CRT monitor, or the viewfinder corners. */
  screen: "crt" | "viewfinder";
  /** Style of the CRT tube (edges, tint). */
  crtLook: CrtLook;
  extras: readonly Extra[];
}

type Key = keyof DisplayPrefs;

/** The display preferences the URL sets explicitly. */
function fromUrl(search: string, params: OverlayParams): Partial<DisplayPrefs> {
  const q = new URLSearchParams(search);
  const out: Partial<DisplayPrefs> = {};
  if (q.has("layout")) out.layout = params.layout;
  if (q.has("tab") || q.has("labels")) {
    out.tabLabels = params.tabLabels;
    out.tabView = params.tabView;
  }
  if (q.has("wolf")) out.wolf = params.wolf;
  if (q.has("screen")) out.screen = params.screen;
  if (q.has("crt")) out.crtLook = params.crtLook;
  if (q.has("extras")) out.extras = [...params.extras];
  return out;
}

function stored(): Partial<DisplayPrefs> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? (JSON.parse(raw) as Partial<DisplayPrefs>) : {};
    return typeof value === "object" && value !== null ? value : {};
  } catch {
    return {};
  }
}

const cycle = <T>(values: readonly T[], current: T): T =>
  values[(values.indexOf(current) + 1) % values.length];

const LAYOUTS: readonly Layout[] = ["cam", "scene"];

/** Drop values an older version stored (the band layout, the third timeline mode). */
function sanitize(p: Partial<DisplayPrefs>): Partial<DisplayPrefs> {
  const out = { ...p };
  if (out.layout !== undefined && !LAYOUTS.includes(out.layout)) delete out.layout;
  if (out.crtLook !== undefined && !CRT_LOOKS.includes(out.crtLook)) delete out.crtLook;
  if (out.tabLabels !== undefined) out.tabView = out.tabLabels === "names" ? "staff" : "tab";
  else delete out.tabView;
  return out;
}

/** Key → what it toggles, for the handler and the help panel. */
export const DISPLAY_KEYS: Readonly<Record<string, { fr: string; en: string }>> = {
  L: { fr: "mise en page (cam ↔ scène)", en: "layout (cam ↔ scene)" },
  T: { fr: "timeline (cases ↔ noms sur une portée)", en: "timeline (frets ↔ names on a staff)" },
  W: { fr: "loup", en: "wolf" },
  F: {
    fr: "cadre de la caméra (écran CRT ↔ viseur)",
    en: "webcam frame (CRT screen ↔ viewfinder)",
  },
  V: {
    fr: "style du CRT (clean → dark → aged → fallout → worn)",
    en: "CRT look (clean → dark → aged → fallout → worn)",
  },
  M: { fr: "mandala des quintes", en: "circle-of-fifths mandala" },
  P: { fr: "pattes sur les toits", en: "paw prints on the roofs" },
  E: { fr: "braises sur les attaques", en: "embers on attacks" },
  A: { fr: "aurore", en: "aurora" },
  O: { fr: "oscilloscope", en: "oscilloscope" },
  K: { fr: "ruban d'accords au lieu de la timeline", en: "chord ribbon instead of the timeline" },
};

const EXTRA_KEYS: Readonly<Record<string, Extra>> = {
  M: "mandala",
  P: "paws",
  E: "embers",
  A: "aurora",
  O: "scope",
  K: "ribbon",
};

/** What a key just did, in a few words (for the toast). */
function describe(key: string, p: DisplayPrefs): string {
  switch (key) {
    case "V":
      return `CRT look: ${p.crtLook} (${CRT_LOOKS.indexOf(p.crtLook) + 1}/${CRT_LOOKS.length})`;
    case "F":
      return `Webcam frame: ${p.screen}`;
    case "L":
      return `Layout: ${p.layout}`;
    case "T":
      return `Timeline: ${p.tabLabels}`;
    case "W":
      return `Wolf: ${p.wolf ? "on" : "off"}`;
    default: {
      const extra = EXTRA_KEYS[key];
      return `${DISPLAY_KEYS[key].en}: ${p.extras.includes(extra) ? "on" : "off"}`;
    }
  }
}

export function useDisplayPrefs(params: OverlayParams, search: string) {
  const [prefs, setPrefs] = useState<DisplayPrefs>(() => ({
    layout: params.layout,
    tabLabels: params.tabLabels,
    tabView: params.tabView,
    wolf: params.wolf,
    screen: "crt",
    crtLook: "clean",
    extras: [...params.extras],
    ...sanitize(stored()),
    ...fromUrl(search, params),
  }));

  // The latest preferences, for key presses (several may come in one render).
  const prefsRef = useRef(prefs);
  useEffect(() => {
    prefsRef.current = prefs;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage blocked: the preferences still apply to this page.
    }
  }, [prefs]);

  // The last change, as a short line for a toast.
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);

  /** Apply a key; returns true when it was a display key. */
  const press = useCallback((key: string): boolean => {
    const k = key.toUpperCase();
    if (!(k in DISPLAY_KEYS)) return false;
    const next = apply(prefsRef.current);
    prefsRef.current = next;
    setPrefs(next);
    setToast((t) => ({ text: describe(k, next), id: (t?.id ?? 0) + 1 }));
    function apply(p: DisplayPrefs): DisplayPrefs {
      const set = <K extends Key>(field: K, value: DisplayPrefs[K]) => ({ ...p, [field]: value });
      switch (k) {
        case "L":
          return set("layout", cycle(LAYOUTS, p.layout));
        case "W":
          return set("wolf", !p.wolf);
        case "F":
          return set("screen", p.screen === "crt" ? "viewfinder" : "crt");
        case "V":
          return set("crtLook", cycle(CRT_LOOKS, p.crtLook));
        case "T": {
          // Two modes: frets on a tablature, or names placed on a staff.
          const names = p.tabLabels !== "names";
          return { ...p, tabLabels: names ? "names" : "frets", tabView: names ? "staff" : "tab" };
        }
        default: {
          const extra = EXTRA_KEYS[k];
          const has = p.extras.includes(extra);
          return set("extras", has ? p.extras.filter((e) => e !== extra) : [...p.extras, extra]);
        }
      }
    }
    return true;
  }, []);

  return { prefs, press, toast };
}
