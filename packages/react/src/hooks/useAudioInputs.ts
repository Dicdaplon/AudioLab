"use client";

/**
 * The audio inputs the browser exposes, kept up to date on `devicechange`.
 *
 * Starts empty (server markup and the first client render agree), lists in
 * an effect. Labels stay empty until the page has been granted a microphone
 * once; `refresh()` re-lists, and is worth calling when a session starts,
 * because Chrome does not reliably fire `devicechange` when permission is
 * granted. `unlockLabels` prompts on mount to reveal the labels (for hosts
 * that match inputs by name, such as an overlay without a start button).
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { listAudioInputs, type AudioInput } from "@audiolab/core";

export interface UseAudioInputsOptions {
  /** Open and stop a throwaway stream on mount when labels are hidden. Default false. */
  unlockLabels?: boolean;
}

export interface AudioInputsState {
  inputs: AudioInput[];
  /** True once at least one input has a label (permission granted). */
  labelled: boolean;
  /** Re-list the inputs. Never rejects: a failure keeps the previous list. */
  refresh(): Promise<void>;
}

export function useAudioInputs(options: UseAudioInputsOptions = {}): AudioInputsState {
  const [inputs, setInputs] = useState<AudioInput[]>([]);
  const unlockRef = useRef(options.unlockLabels ?? false);
  const aliveRef = useRef(true);

  const list = useCallback(async (unlockLabels: boolean) => {
    try {
      const next = await listAudioInputs({ unlockLabels });
      if (aliveRef.current) setInputs(next);
    } catch {
      // Permission refused or device layer unavailable: keep what we had.
    }
  }, []);

  const refresh = useCallback(() => list(false), [list]);

  useEffect(() => {
    aliveRef.current = true;
    void list(unlockRef.current);
    const devices = globalThis.navigator?.mediaDevices;
    const onChange = () => void list(false);
    devices?.addEventListener?.("devicechange", onChange);
    return () => {
      aliveRef.current = false;
      devices?.removeEventListener?.("devicechange", onChange);
    };
  }, [list]);

  return { inputs, labelled: inputs.some((i) => i.label !== ""), refresh };
}
