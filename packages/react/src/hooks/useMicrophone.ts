"use client";

/**
 * Microphone session lifecycle: one `MicSource` shared by every analysis
 * hook, with race-safe start/stop.
 *
 * Races handled:
 * - double click / two Start buttons: a second `start()` while one is
 *   pending (or already running) is a no-op;
 * - stop or unmount while the permission prompt is open: the session token
 *   changes, so when `openMicrophone()` resolves the source is disposed
 *   immediately instead of being installed on a dead session (this also
 *   covers StrictMode's mount/unmount/mount in development).
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  checkMicrophoneSupport,
  openMicrophone,
  toMicError,
  type MicErrorInfo,
  type MicSource,
} from "@audiolab/core";

export interface MicrophoneSession {
  /** Open source, or null when stopped. */
  mic: MicSource | null;
  /** True while a source is open. */
  running: boolean;
  /** True between the click and the end of the permission prompt. */
  starting: boolean;
  /** User-facing message of the last failure, cleared by the next start. */
  error: string | null;
  /**
   * Why this environment cannot capture at all (insecure context, no
   * getUserMedia or AudioContext), or null when it can. Checked after mount,
   * so server-rendered markup and the first client render agree.
   */
  unsupported: MicErrorInfo | null;
}

/** The part of the session that start/stop drive. */
type SessionState = Omit<MicrophoneSession, "unsupported">;

const IDLE: SessionState = { mic: null, running: false, starting: false, error: null };

export function useMicrophone() {
  const [session, setSession] = useState<SessionState>(IDLE);
  const [unsupported, setUnsupported] = useState<MicErrorInfo | null>(null);
  const micRef = useRef<MicSource | null>(null);
  const startingRef = useRef(false);
  const tokenRef = useRef(0);

  const stop = useCallback(async () => {
    tokenRef.current += 1; // invalidates any start() still awaiting
    const mic = micRef.current;
    micRef.current = null;
    setSession((s) => ({ ...IDLE, error: s.error }));
    if (mic) await mic.dispose();
  }, []);

  const start = useCallback(async () => {
    if (micRef.current || startingRef.current) return;
    startingRef.current = true;
    const token = ++tokenRef.current;
    setSession({ mic: null, running: false, starting: true, error: null });
    try {
      const mic = await openMicrophone();
      if (token !== tokenRef.current) {
        // stop() or unmount happened during the prompt.
        await mic.dispose();
        return;
      }
      micRef.current = mic;
      setSession({ mic, running: true, starting: false, error: null });
    } catch (err) {
      if (token === tokenRef.current) {
        setSession({ mic: null, running: false, starting: false, error: toMicError(err).message });
      }
    } finally {
      startingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setUnsupported(checkMicrophoneSupport());
    return () => {
      void stop();
    };
  }, [stop]);

  return { ...session, unsupported, start, stop };
}
