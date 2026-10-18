"use client";

/**
 * A metronome bound to a component: `start()` begins one on the context
 * (stopping the previous one), `stop()` ends it, and it stops by itself on
 * unmount or when the context changes. The clicks are scheduled on the audio
 * clock (`startMetronome`); `metronome.grid` places beats for the display.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { type Metronome, type MetronomeOptions, startMetronome } from "@audiolab/core";

export interface MetronomeControls {
  /** The running metronome, or null. */
  metronome: Metronome | null;
  start: (options: MetronomeOptions) => Metronome | null;
  stop: () => void;
  /** Click sound of the running metronome (re-renders when changed). */
  sound: boolean;
  setSound: (on: boolean) => void;
}

export function useMetronome(context: BaseAudioContext | null): MetronomeControls {
  const [metronome, setMetronome] = useState<Metronome | null>(null);
  const [sound, setSoundState] = useState(true);
  const ref = useRef<Metronome | null>(null);

  const stop = useCallback(() => {
    ref.current?.stop();
    ref.current = null;
    setMetronome(null);
  }, []);

  const start = useCallback(
    (options: MetronomeOptions) => {
      ref.current?.stop();
      if (!context) {
        ref.current = null;
        setMetronome(null);
        return null;
      }
      const m = startMetronome(context, options);
      ref.current = m;
      setMetronome(m);
      setSoundState(m.sound);
      return m;
    },
    [context],
  );

  const setSound = useCallback((on: boolean) => {
    ref.current?.setSound(on);
    setSoundState(on);
  }, []);

  useEffect(() => stop, [context, stop]);

  return { metronome, start, stop, sound, setSound };
}
