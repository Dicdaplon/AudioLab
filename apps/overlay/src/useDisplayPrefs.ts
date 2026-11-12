/**
 * What the overlay shows (layout, timeline view, backdrop, notation, wolf,
 * optional layers), changed with single keys while live and remembered in
 * localStorage. A URL parameter, when present, sets the starting value of
 * its preference; the keys take it from there.
 *
 *   L layout · T timeline (frets → names → staff) · B backdrop · N notation
 *   W wolf · M mandala · P paw prints · E embers · A aurora · O oscilloscope
 *   K chord ribbon instead of the timeline
 */

import { useCallback, useEffect, useState } from "react";

import type { Extra, Layout, OverlayParams } from "./params";

const STORAGE_KEY = "audiolab-overlay-display";

export interface DisplayPrefs {
  layout: Layout;
  notation: OverlayParams["notation"];
  tabLabels: OverlayParams["tabLabels"];
  tabView: OverlayParams["tabView"];
  backdrop: OverlayParams["backdrop"];
  wolf: boolean;
  extras: readonly Extra[];
}

type Key = keyof DisplayPrefs;

/** The display preferences the URL sets explicitly. */
function fromUrl(search: string, params: OverlayParams): Partial<DisplayPrefs> {
  const q = new URLSearchParams(search);
  const out: Partial<DisplayPrefs> = {};
  if (q.has("layout")) out.layout = params.layout;
  if (q.has("notation")) out.notation = params.notation;
  if (q.has("tab") || q.has("labels")) {
    out.tabLabels = params.tabLabels;
    out.tabView = params.tabView;
  }
  if (q.has("backdrop")) out.backdrop = params.backdrop;
  if (q.has("wolf")) out.wolf = params.wolf;
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

const LAYOUTS: readonly Layout[] = ["cam", "scene", "band"];
const NOTATIONS: readonly DisplayPrefs["notation"][] = ["en", "fr", "both"];
const BACKDROPS: readonly DisplayPrefs["backdrop"][] = ["night", "plain", "off"];
const TIMELINES = ["frets", "names", "staff"] as const;

/** Key → what it toggles, for the handler and the help panel. */
export const DISPLAY_KEYS: Readonly<Record<string, { fr: string; en: string }>> = {
  L: { fr: "mise en page (cam → scène → bandeau)", en: "layout (cam → scene → band)" },
  T: { fr: "timeline (cases → noms → portée)", en: "timeline (frets → names → staff)" },
  B: { fr: "fond (nuit → sobre → aucun)", en: "backdrop (night → plain → off)" },
  N: { fr: "notation (anglaise → française → les deux)", en: "notation (English → French → both)" },
  W: { fr: "loup", en: "wolf" },
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

export function useDisplayPrefs(params: OverlayParams, search: string) {
  const [prefs, setPrefs] = useState<DisplayPrefs>(() => ({
    layout: params.layout,
    notation: params.notation,
    tabLabels: params.tabLabels,
    tabView: params.tabView,
    backdrop: params.backdrop,
    wolf: params.wolf,
    extras: [...params.extras],
    ...stored(),
    ...fromUrl(search, params),
  }));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage blocked: the preferences still apply to this page.
    }
  }, [prefs]);

  /** Apply a key; returns true when it was a display key. */
  const press = useCallback((key: string): boolean => {
    const k = key.toUpperCase();
    if (!(k in DISPLAY_KEYS)) return false;
    setPrefs((p) => {
      const set = <K extends Key>(field: K, value: DisplayPrefs[K]) => ({ ...p, [field]: value });
      switch (k) {
        case "L":
          return set("layout", cycle(LAYOUTS, p.layout));
        case "N":
          return set("notation", cycle(NOTATIONS, p.notation));
        case "B":
          return set("backdrop", cycle(BACKDROPS, p.backdrop));
        case "W":
          return set("wolf", !p.wolf);
        case "T": {
          const now = p.tabView === "staff" ? "staff" : p.tabLabels;
          const next = cycle(TIMELINES, now);
          return {
            ...p,
            tabView: next === "staff" ? "staff" : "tab",
            tabLabels: next === "names" ? "names" : "frets",
          };
        }
        default: {
          const extra = EXTRA_KEYS[k];
          const has = p.extras.includes(extra);
          return set("extras", has ? p.extras.filter((e) => e !== extra) : [...p.extras, extra]);
        }
      }
    });
    return true;
  }, []);

  return { prefs, press };
}
