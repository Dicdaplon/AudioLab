/**
 * Overlay settings, all from the URL, so each OBS browser source carries its
 * own configuration and nothing machine-specific lives in the code.
 *
 *   ?harmony=Loopback        input for key, chords, tempo (label substring or id)
 *   &notes=Analogue 1        input for the played notes and attacks (default: harmony)
 *   &chords=notes|harmony    where the chords are read (default notes: what you play)
 *   &layout=cam|scene|band   page layout (default cam)
 *   &view=key|chord|tuner|ribbon|mandala|…   one element alone, top-left
 *   &notation=both|fr|en     note names (default both: French, English small)
 *   &song=180                seconds of the song-key window
 *   &cam=48,48,1248,702      webcam rectangle the visuals keep clear of
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
  chords: "notes" | "harmony";
  layout: Layout;
  view: string | null;
  notation: Notation | "both";
  songSeconds: number;
  cam: Rect;
  demo: string | null;
  listen: boolean;
  background: boolean;
  debug: boolean;
  hud: boolean;
}

const DEFAULT_CAM: Rect = { x: 48, y: 48, w: 1248, h: 702 };

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
  const song = Number(q.get("song"));
  return {
    harmony,
    notes: q.get("notes") ?? harmony,
    chords: q.get("chords") === "harmony" ? "harmony" : "notes",
    layout: layout === "scene" || layout === "band" ? layout : "cam",
    view: q.get("view"),
    notation: notation === "fr" || notation === "en" ? notation : "both",
    songSeconds: Number.isFinite(song) && song >= 10 ? song : 180,
    cam: rect(q.get("cam")),
    demo: q.has("demo") ? q.get("demo") || "synth" : null,
    listen: q.get("listen") === "1",
    background: q.get("bg") === "1",
    debug: q.get("debug") === "1",
    hud: q.get("hud") !== "0",
  };
}
