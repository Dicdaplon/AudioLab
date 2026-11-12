"use client";

/**
 * Everything a stage shows, from one or two sessions: the harmony source
 * (key, chords, chroma, tempo, the mix's waveform) and the notes source
 * (played note, attacks, the instrument's waveform). Pass the same session
 * twice to analyse a single input.
 *
 * Two outputs, for two rhythms:
 * - React state at the analysis rate (10–20 Hz) for the plates: the settled
 *   key, the chord changes, the played note, the tempo;
 * - `signals`, a mutable object read by the canvas visuals on every
 *   animation frame (chroma, onsets, beat phase, signal taps), so nothing
 *   re-renders at display rate.
 *
 * Times are seconds on the performance clock (`performance.now() / 1000`),
 * the clock `StageCanvas` hands to `draw`.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import {
  ANALYSIS_DEFAULTS,
  AdaptiveLevel,
  BeatClock,
  ChordChangeTracker,
  KeySettler,
  SongBreak,
  type AdaptiveLevelReading,
  type BeatPhase,
  type ChordQuality,
  type ChordReading,
  type KeyReading,
  type KeySettlerOptions,
  type ChordChangeOptions,
  type MicSource,
  type PitchEstimate,
  type SignalTap,
  type TempoEstimate,
  type TimedOnset,
} from "@audiolab/core";

import { useOnsetAnalysis } from "../hooks/useOnsetAnalysis";
import { usePitch } from "../hooks/usePitch";
import { useSignalTap } from "../hooks/useSignalTap";
import { useTempoAnalysis } from "../hooks/useTempoAnalysis";
import { useTonality } from "../hooks/useTonality";

/** An attack, for particles and beat rings. */
export interface StageOnset {
  /** Performance-clock seconds. */
  time: number;
  /** ODF peak strength (see `OnsetEvent.strength`). */
  strength: number;
  /** Pitch class sounding at the attack (played note, else chord root), or null. */
  pitchClass: number | null;
}

export interface StageSignals {
  /** Raw level of the harmony session (`TonalityFrame.signalLevelDb`). */
  levelDb: number;
  /**
   * Adaptive levels (playing or not, 0 … 1 between the learnt floor and the
   * recent peaks) of the harmony and notes sessions: displays use these
   * rather than fixed dB thresholds.
   */
  harmonyLevel: AdaptiveLevelReading;
  notesLevel: AdaptiveLevelReading;
  key: KeyReading;
  chord: ChordReading;
  /** Performance-clock time of the last chord change, or null. */
  chordChangedAt: number | null;
  /** Performance-clock time of the last key settle / modulation, or null. */
  keyEventAt: number | null;
  note: PitchEstimate | null;
  /**
   * 12-bin chromas (L1-normalised): last frame and live window (8 s) of the
   * harmony session, chord window (1 s) of the chord source.
   */
  chroma: { instant: Float32Array; chord: Float32Array; live: Float32Array };
  tempo: TempoEstimate | null;
  /** Beat phase at a performance-clock time, or null without a confident tempo. */
  beatAt(time: number): BeatPhase | null;
  /** Last attacks, oldest first (at most 64). `onsetCount` grows with every attack. */
  onsets: StageOnset[];
  onsetCount: number;
  /** Display taps (2048-point, smoothed) on the harmony and notes sessions. */
  harmonyTap: SignalTap | null;
  notesTap: SignalTap | null;
}

export interface UseStageSignalsOptions {
  /** Window of the song key, in seconds. Default 180. */
  songSeconds?: number;
  /** Chord qualities considered. Default triads plus 7, maj7, m7. */
  chordQualities?: readonly ChordQuality[];
  /**
   * Which session the chords are read from: "harmony" (the mix: the backing
   * carries the chords) or "notes" (the instrument: the chords you play).
   * Default "harmony".
   */
  chords?: "harmony" | "notes";
  /** Run the pitch tracker on the notes source. Default true. */
  pitch?: boolean;
  /** Run the tempo analysis on the harmony source. Default true. */
  tempo?: boolean;
  /** Run the onset detector on the notes source. Default true. */
  onsets?: boolean;
  /**
   * Seconds of silence that end a song and start the key over (the song-key
   * window would otherwise carry the last song into the next). 0 disables.
   * Default 8.
   */
  songBreakSeconds?: number;
  keySettler?: KeySettlerOptions;
  chordChanges?: ChordChangeOptions;
}

export interface StageState {
  signals: RefObject<StageSignals>;
  key: KeyReading;
  chord: ChordReading;
  note: PitchEstimate | null;
  tempo: TempoEstimate | null;
  levelDb: number;
  /** Start the song over: clears the key, the chord history and the analysis windows. */
  reset(): void;
}

const ONSET_MEMORY = 64;
const DEFAULT_QUALITIES: readonly ChordQuality[] = ["maj", "min", "dom7", "maj7", "min7"];
const LISTENING: KeyReading = {
  phase: "listening",
  key: null,
  runnerUp: null,
  stability: 0,
  event: null,
};
const NO_CHORD: ChordReading = {
  current: null,
  runnerUp: null,
  margin: 0,
  silent: true,
  changed: false,
  history: [],
};

function nowSeconds(): number {
  return (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
}

export function useStageSignals(
  harmony: MicSource | null,
  notes: MicSource | null,
  options: UseStageSignalsOptions = {},
): StageState {
  const {
    songSeconds = 180,
    pitch = true,
    tempo = true,
    onsets = true,
    songBreakSeconds = 8,
    chords: chordSource = "harmony",
  } = options;
  const chordQualities = options.chordQualities ?? DEFAULT_QUALITIES;

  const tonality = useTonality(harmony, {
    tonalityAcquisitionSeconds: songSeconds,
    liveAcquisitionSeconds: 8,
    chordWindowSeconds: ANALYSIS_DEFAULTS.chordWindowSeconds,
    chordQualities,
  });
  // The notes session gets its own frames (level, and chords when asked)
  // unless it is the harmony session itself.
  const separateNotes = notes !== harmony;
  const notesTonality = useTonality(separateNotes ? notes : null, {
    tonalityAcquisitionSeconds: 8,
    liveAcquisitionSeconds: 8,
    chordWindowSeconds: ANALYSIS_DEFAULTS.chordWindowSeconds,
    chordQualities,
  });
  const chordsFromNotes = chordSource === "notes" && separateNotes;
  const chordFrame = chordsFromNotes ? notesTonality : tonality;
  const pitchState = usePitch(notes, { enabled: pitch });
  const tempoState = useTempoAnalysis(harmony, { enabled: tempo, method: "flux" });
  const harmonyTap = useSignalTap(harmony);
  const notesTap = useSignalTap(notes);

  const settlerRef = useRef<KeySettler | null>(null);
  settlerRef.current ??= new KeySettler(options.keySettler);
  const chordsRef = useRef<ChordChangeTracker | null>(null);
  chordsRef.current ??= new ChordChangeTracker(options.chordChanges);
  const beatRef = useRef<BeatClock | null>(null);
  beatRef.current ??= new BeatClock();
  const harmonyLevelRef = useRef<AdaptiveLevel | null>(null);
  harmonyLevelRef.current ??= new AdaptiveLevel();
  const notesLevelRef = useRef<AdaptiveLevel | null>(null);
  notesLevelRef.current ??= new AdaptiveLevel();
  const breakRef = useRef<SongBreak | null>(null);
  breakRef.current ??= new SongBreak({ seconds: songBreakSeconds || Infinity });

  const signalsRef = useRef<StageSignals | null>(null);
  const quiet: AdaptiveLevelReading = {
    open: false,
    level: 0,
    floorDb: -100,
    ceilingDb: -88,
    gatedDb: -100,
  };
  signalsRef.current ??= {
    levelDb: tonality.signalLevelDb,
    harmonyLevel: quiet,
    notesLevel: quiet,
    key: LISTENING,
    chord: NO_CHORD,
    chordChangedAt: null,
    keyEventAt: null,
    note: null,
    chroma: {
      instant: tonality.instantaneousChroma,
      chord: tonality.chordChroma,
      live: tonality.liveAcquisitionChroma,
    },
    tempo: null,
    beatAt: (time) => beatRef.current!.at(time),
    onsets: [],
    onsetCount: 0,
    harmonyTap: null,
    notesTap: null,
  };
  const signals = signalsRef.current;

  const [readings, setReadings] = useState<{ key: KeyReading; chord: ChordReading }>({
    key: LISTENING,
    chord: NO_CHORD,
  });

  const resetTonality = tonality.reset;
  const resetNotesTonality = notesTonality.reset;
  const reset = useCallback(() => {
    resetTonality();
    resetNotesTonality();
    settlerRef.current!.reset();
    chordsRef.current!.reset();
    signals.key = LISTENING;
    signals.chord = NO_CHORD;
    signals.chordChangedAt = null;
    signals.keyEventAt = null;
    setReadings({ key: LISTENING, chord: NO_CHORD });
  }, [resetTonality, resetNotesTonality, signals]);

  // The trackers see the gated level: silent whenever the adaptive gate of
  // their session is closed, whatever the input's gain or noise floor.
  const followChords = useCallback(
    (chords: Parameters<ChordChangeTracker["push"]>[0], gatedDb: number, t: number) => {
      const chord = chordsRef.current!.push(chords, gatedDb, t);
      signals.chord = chord;
      if (chord.changed) signals.chordChangedAt = t;
      setReadings((r) => ({ key: r.key, chord: { ...chord, history: [...chord.history] } }));
    },
    [signals],
  );

  // One harmony frame (10 Hz): settle the key, and follow the chords when
  // they come from the mix; a long silence ends the song.
  const { chords, tonalityKeys, signalLevelDb } = tonality;
  useEffect(() => {
    const t = nowSeconds();
    const level = harmonyLevelRef.current!.push(signalLevelDb, t);
    signals.levelDb = signalLevelDb;
    signals.harmonyLevel = level;
    if (!separateNotes) signals.notesLevel = level;
    if (breakRef.current!.push(level.gatedDb, t)) {
      reset();
      return;
    }
    const key = settlerRef.current!.push(tonalityKeys, level.gatedDb, t);
    signals.key = key;
    if (key.event) signals.keyEventAt = t;
    setReadings((r) => ({ key, chord: r.chord }));
    if (!chordsFromNotes) followChords(chords, level.gatedDb, t);
  }, [
    chords,
    tonalityKeys,
    signalLevelDb,
    signals,
    reset,
    separateNotes,
    chordsFromNotes,
    followChords,
  ]);

  // One notes frame: its level, and the chords when they come from the instrument.
  const notesChords = notesTonality.chords;
  const notesLevelDb = notesTonality.signalLevelDb;
  useEffect(() => {
    if (!separateNotes) return;
    const t = nowSeconds();
    const level = notesLevelRef.current!.push(notesLevelDb, t);
    signals.notesLevel = level;
    if (chordsFromNotes) followChords(notesChords, level.gatedDb, t);
  }, [notesChords, notesLevelDb, signals, separateNotes, chordsFromNotes, followChords]);

  signals.chroma.instant = tonality.instantaneousChroma;
  signals.chroma.chord = chordFrame.chordChroma;
  signals.chroma.live = tonality.liveAcquisitionChroma;
  signals.note = pitchState.estimate;

  const estimate = tempoState.frame?.estimate ?? null;
  useEffect(() => {
    signals.tempo = estimate;
    beatRef.current!.setTempo(estimate);
  }, [estimate, signals]);

  const onOnset = useCallback(
    (onset: TimedOnset) => {
      const time = onset.perfTimeMs !== null ? onset.perfTimeMs / 1000 : nowSeconds();
      const pc = signals.note?.pitchClass ?? signals.chord.current?.root ?? null;
      signals.onsets.push({ time, strength: onset.strength, pitchClass: pc });
      if (signals.onsets.length > ONSET_MEMORY) signals.onsets.shift();
      signals.onsetCount += 1;
      beatRef.current!.onset(time);
    },
    [signals],
  );
  useOnsetAnalysis(notes, { enabled: onsets, onOnset });

  // Taps live in refs filled by effects; expose them on every render.
  useEffect(() => {
    signals.harmonyTap = harmonyTap.current;
    signals.notesTap = notesTap.current;
  });

  return {
    signals: signalsRef as RefObject<StageSignals>,
    key: readings.key,
    chord: readings.chord,
    note: pitchState.estimate,
    tempo: estimate,
    levelDb: signalLevelDb,
    reset,
  };
}
