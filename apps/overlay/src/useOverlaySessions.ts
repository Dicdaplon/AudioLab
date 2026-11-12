/**
 * The overlay's sessions: the harmony input and the notes input, opened on
 * mount (an OBS browser source has no button to click) and retried every few
 * seconds while an input is missing, so plugging the interface in after OBS
 * starts just works. In demo mode both sessions take the demo's streams.
 */

import { useEffect, useState } from "react";

import { findAudioInput, listAudioInputs, type AudioInput, type MicSource } from "@audiolab/core";
import { useMicrophone } from "@audiolab/react";

import { startDemo, type DemoAudio } from "./demo";
import type { OverlayParams } from "./params";

const RETRY_MS = 3000;

export interface OverlaySessions {
  harmony: MicSource | null;
  notes: MicSource | null;
  inputs: AudioInput[];
  /** Resolved device per role (null: browser default, or demo). */
  devices: { harmony: AudioInput | null; notes: AudioInput | null };
  errors: string[];
}

/** Resolve the inputs by name once labels are visible; null id = default input. */
function useResolvedInputs(params: OverlayParams, enabled: boolean) {
  const [state, setState] = useState<{
    inputs: AudioInput[];
    harmony: AudioInput | null;
    notes: AudioInput | null;
    ready: boolean;
    error: string | null;
  }>({ inputs: [], harmony: null, notes: null, ready: false, error: null });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer = 0;
    const resolve = async () => {
      try {
        const inputs = await listAudioInputs({ unlockLabels: true });
        const harmony = params.harmony ? findAudioInput(inputs, params.harmony) : null;
        const notes = params.notes ? findAudioInput(inputs, params.notes) : null;
        const missing = [
          params.harmony && !harmony ? `harmony « ${params.harmony} »` : null,
          params.notes && !notes ? `notes « ${params.notes} »` : null,
        ].filter(Boolean);
        if (!alive) return;
        setState({
          inputs,
          harmony,
          notes,
          ready: missing.length === 0,
          error: missing.length ? `Entrée introuvable : ${missing.join(", ")}` : null,
        });
        if (missing.length) timer = window.setTimeout(resolve, RETRY_MS);
      } catch (err) {
        if (!alive) return;
        setState((s) => ({ ...s, error: String(err) }));
        timer = window.setTimeout(resolve, RETRY_MS);
      }
    };
    void resolve();
    const onChange = () => void resolve();
    navigator.mediaDevices?.addEventListener?.("devicechange", onChange);
    return () => {
      alive = false;
      clearTimeout(timer);
      navigator.mediaDevices?.removeEventListener?.("devicechange", onChange);
    };
  }, [enabled, params.harmony, params.notes]);

  return state;
}

/** Start a session as soon as `ready`, and again a while after any failure. */
function useAutoStart(session: ReturnType<typeof useMicrophone>, ready: boolean) {
  const { running, starting, error, start } = session;
  useEffect(() => {
    if (!ready || running || starting) return;
    if (!error) {
      void start();
      return;
    }
    const timer = setTimeout(() => void start(), RETRY_MS);
    return () => clearTimeout(timer);
  }, [ready, running, starting, error, start]);
}

export function useOverlaySessions(params: OverlayParams): OverlaySessions {
  const [demo, setDemo] = useState<DemoAudio | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.demo) return;
    let audio: DemoAudio | null = null;
    let alive = true;
    startDemo(params.demo, params.listen).then(
      (a) => {
        if (alive) setDemo((audio = a));
        else a.stop();
      },
      (err) => alive && setDemoError(String(err)),
    );
    return () => {
      alive = false;
      audio?.stop();
    };
  }, [params.demo, params.listen]);

  const resolved = useResolvedInputs(params, !params.demo);
  const shared =
    !params.demo && (resolved.notes?.deviceId ?? "") === (resolved.harmony?.deviceId ?? "");

  const harmony = useMicrophone(
    demo ? { context: demo.context, stream: demo.mix } : { deviceId: resolved.harmony?.deviceId },
  );
  const notes = useMicrophone(
    demo ? { context: demo.context, stream: demo.lead } : { deviceId: resolved.notes?.deviceId },
  );
  useAutoStart(harmony, params.demo ? demo !== null : resolved.ready);
  useAutoStart(notes, params.demo ? demo !== null : resolved.ready && !shared);

  return {
    harmony: harmony.mic,
    notes: shared ? harmony.mic : notes.mic,
    inputs: resolved.inputs,
    devices: { harmony: resolved.harmony, notes: resolved.notes },
    errors: [demoError, resolved.error, harmony.error, shared ? null : notes.error].filter(
      (e): e is string => !!e,
    ),
  };
}
