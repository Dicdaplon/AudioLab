/**
 * The overlay's live settings: `useStoredStageSettings` under the overlay's
 * own key, starting with the chords read from the instrument, and the URL
 * parameters (`song=`, `chords=`, `chordWindow=`, `gate=`) applied on top for
 * this page only.
 */

import { useStoredStageSettings } from "@audiolab/react/stage";

const STORAGE_KEY = "audiolab-overlay-settings";
const INITIAL = { chordSource: "notes" } as const;

function urlOverrides(search: string): Record<string, unknown> {
  const q = new URLSearchParams(search);
  const out: Record<string, unknown> = {};
  if (q.has("song")) out.songSeconds = q.get("song");
  if (q.has("chords")) out.chordSource = q.get("chords");
  if (q.has("chordWindow")) out.chordWindowSeconds = q.get("chordWindow");
  if (q.has("gate")) out.gateStrictness = q.get("gate");
  return out;
}

export function useOverlaySettings(search: string) {
  return useStoredStageSettings({
    storageKey: STORAGE_KEY,
    initial: INITIAL,
    overrides: urlOverrides(search),
  });
}
