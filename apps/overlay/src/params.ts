/**
 * Overlay settings, all from the URL, so each OBS browser source carries its
 * own configuration and nothing machine-specific lives in the code.
 *
 *   ?harmony=Loopback        input for key, chords, tempo (label substring or id)
 *   &notes=Analogue 1        input for the played notes and attacks (default: harmony)
 *   &chords=notes|harmony    where the chords are read (overrides the stored setting)
 *   &chordWindow=2           chord window in seconds (overrides the stored setting)
 *   &gate=0.5                playing gate 0 gentle … 1 strict (overrides the stored setting)
 *   &layout=cam|scene|band   page layout (default cam)
 *   &view=key|chord|tuner|ribbon|mandala|…   one element alone, top-left
 *   &notation=both|fr|en     note names (default both: French, English small)
 *   &song=180                seconds of the song-key window (overrides the stored setting)
 *   &view=settings           the live settings alone, for an OBS custom dock
 *   &cam=48,48,1344,756      webcam rectangle the visuals keep clear of
 *   &extras=mandala,paws     optional layers, off by default: mandala, paws, embers,
 *                            aurora, scope, ribbon (the layouts stay light without them)
 *   &title=Blue Bossa        song title (scene layout)
 *   &wolf=0                  no wolf mascot (it reacts to the playing and talks now and then)
 *   &backdrop=night|plain|off   opaque background around the webcam (default night;
 *                            off in the band layout). Put the overlay above the webcam in OBS.
 *   &tab=frets|names|staff   timeline: tablature with frets or note names, or a staff
 *   &demo=synth|<url>        no inputs: a built-in synth or an audio file
 *   &listen=1                demo mode: also play the demo on the speakers
 *   &bg=1                    draw a stand-in background (previews, screenshots)
 *   &debug=1                 show inputs, levels and errors
 *   &hud=0                   never show the info panel, not even on errors (D toggles it)
 */

import type { Notation } from "@audiolab/react/stage";

export type Layout = "cam" | "scene" | "band";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OverlayParams {
  harmony: string;
  notes: string;
  layout: Layout;
  view: string | null;
  notation: Notation | "both";
  cam: Rect;
  demo: string | null;
  listen: boolean;
  background: boolean;
  debug: boolean;
  hud: boolean;
  extras: ReadonlySet<Extra>;
  title: string;
  tabLabels: "frets" | "names";
  /** Timeline as a tablature or a staff. */
  tabView: "tab" | "staff";
  backdrop: "night" | "plain" | "off";
  wolf: boolean;
}

export type Extra = "mandala" | "paws" | "embers" | "aurora" | "scope" | "ribbon";
const EXTRAS: readonly Extra[] = ["mandala", "paws", "embers", "aurora", "scope", "ribbon"];

const DEFAULT_CAM: Rect = { x: 48, y: 48, w: 1344, h: 756 };

function rect(value: string | null): Rect {
  const n = (value ?? "").split(",").map(Number);
  if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) return DEFAULT_CAM;
  return { x: n[0], y: n[1], w: n[2], h: n[3] };
}

export function readParams(search: string): OverlayParams {
  const q = new URLSearchParams(search);
  const harmony = q.get("harmony") ?? "";
  const layout = q.get("layout");
  const notation = q.get("notation");
  return {
    harmony,
    notes: q.get("notes") ?? harmony,
    layout: layout === "scene" || layout === "band" ? layout : "cam",
    view: q.get("view"),
    notation: notation === "fr" || notation === "en" ? notation : "both",
    cam: rect(q.get("cam")),
    demo: q.has("demo") ? q.get("demo") || "synth" : null,
    listen: q.get("listen") === "1",
    background: q.get("bg") === "1",
    debug: q.get("debug") === "1",
    hud: q.get("hud") !== "0",
    extras: new Set(
      (q.get("extras") ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter((e): e is Extra => (EXTRAS as readonly string[]).includes(e)),
    ),
    title: q.get("title") ?? "",
    tabLabels: q.get("tab") === "names" || q.get("labels") === "names" ? "names" : "frets",
    tabView: q.get("tab") === "staff" ? "staff" : "tab",
    wolf: q.get("wolf") !== "0",
    backdrop:
      q.get("backdrop") === "plain" ? "plain" : q.get("backdrop") === "off" ? "off" : "night",
  };
}
