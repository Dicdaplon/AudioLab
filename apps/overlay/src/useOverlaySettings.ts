/**
 * The overlay's live settings: stored in localStorage (so they survive a
 * restart of OBS), overridable from the URL, and shared between every page
 * of the overlay's origin. The overlay source and an OBS dock showing
 * `?view=settings` stay in sync: a change in one is posted on a
 * BroadcastChannel and picked up by the other (the `storage` event covers
 * browsers without BroadcastChannel).
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { normalizeStageSettings, type StageSettings } from "@audiolab/core";

const STORAGE_KEY = "audiolab-overlay-settings";
const CHANNEL = "audiolab-overlay-settings";

function load(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(settings: StageSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked: the settings still apply to this page.
  }
}

/**
 * Settings from storage, then URL overrides (`song=`, `chords=`,
 * `chordWindow=`, `gate=`), normalised.
 */
function initial(search: string): StageSettings {
  const q = new URLSearchParams(search);
  // The overlay reads the chords from the instrument unless told otherwise.
  const stored = (load() ?? { chordSource: "notes" }) as Record<string, unknown>;
  const fromUrl: Record<string, unknown> = {};
  if (q.has("song")) fromUrl.songSeconds = q.get("song");
  if (q.has("chords")) fromUrl.chordSource = q.get("chords");
  if (q.has("chordWindow")) fromUrl.chordWindowSeconds = q.get("chordWindow");
  if (q.has("gate")) fromUrl.gateStrictness = q.get("gate");
  return normalizeStageSettings({ ...stored, ...fromUrl });
}

export function useOverlaySettings(search: string) {
  const [settings, setSettings] = useState<StageSettings>(() => initial(search));
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(CHANNEL) : null;
    channelRef.current = channel;
    const onMessage = (e: MessageEvent) => setSettings(normalizeStageSettings(e.data));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setSettings(normalizeStageSettings(JSON.parse(e.newValue)));
        } catch {
          // Ignore a corrupt value.
        }
      }
    };
    channel?.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      channel?.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((next: StageSettings) => {
    const clean = normalizeStageSettings(next);
    setSettings(clean);
    save(clean);
    channelRef.current?.postMessage(clean);
  }, []);

  return { settings, update };
}
