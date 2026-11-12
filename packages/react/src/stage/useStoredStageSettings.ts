"use client";

/**
 * Stage settings that persist and stay in sync across the pages of an
 * origin: stored in localStorage, shared on a BroadcastChannel (the
 * `storage` event as a fallback), always normalised. An overlay source and
 * a settings dock (or two lab tabs) show the same values, and a change in
 * one applies to the others at once.
 *
 * `overrides` (e.g. from the page URL) win over stored and received values
 * on this page only; they are not stored. The first render uses
 * `initial` + `overrides`, so server markup and the first client render
 * agree; the stored values are read in an effect.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { normalizeStageSettings, type StageSettings } from "@audiolab/core";

export interface UseStoredStageSettingsOptions {
  /** localStorage key, also the channel name. Default "audiolab-stage-settings". */
  storageKey?: string;
  /** Values before anything is stored (missing keys: `DEFAULT_STAGE_SETTINGS`). */
  initial?: Partial<StageSettings>;
  /** Values this page always applies on top (not stored, not broadcast as its own). */
  overrides?: Record<string, unknown>;
}

export interface StoredStageSettings {
  settings: StageSettings;
  /** Store, apply and broadcast new settings. */
  update(next: StageSettings): void;
}

function readStored(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useStoredStageSettings(
  options: UseStoredStageSettingsOptions = {},
): StoredStageSettings {
  const { storageKey = "audiolab-stage-settings", initial, overrides } = options;
  // Read through refs: callers usually pass fresh object literals.
  const overridesRef = useRef(overrides);
  useEffect(() => {
    overridesRef.current = overrides;
  });
  const apply = useCallback(
    (base: unknown) =>
      normalizeStageSettings({
        ...(typeof base === "object" && base !== null ? base : {}),
        ...overridesRef.current,
      }),
    [],
  );

  const [settings, setSettings] = useState<StageSettings>(() =>
    normalizeStageSettings({ ...initial, ...overrides }),
  );
  const initialRef = useRef(initial);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    setSettings(apply({ ...initialRef.current, ...(readStored(storageKey) as object | null) }));
    const channel =
      typeof BroadcastChannel === "function" ? new BroadcastChannel(storageKey) : null;
    channelRef.current = channel;
    const onMessage = (e: MessageEvent) => setSettings(apply(e.data));
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey || !e.newValue) return;
      try {
        setSettings(apply(JSON.parse(e.newValue)));
      } catch {
        // A corrupt value: keep the current settings.
      }
    };
    channel?.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      channel?.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, [storageKey, apply]);

  const update = useCallback(
    (next: StageSettings) => {
      const clean = normalizeStageSettings(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(clean));
      } catch {
        // Storage blocked: the settings still apply to this page.
      }
      channelRef.current?.postMessage(clean);
      setSettings(apply(clean));
    },
    [storageKey, apply],
  );

  return { settings, update };
}
