/**
 * Live-path rig for synthetic tests: generated audio is framed like the
 * hook does it (AnalyserNode emulation polled at 10 fps) and fed to a
 * TonalityEngine through `processDbSpectrum`, i.e. including the
 * dB → magnitude gate. At 12 kHz a 4096-point FFT has the same bin spacing
 * (2.93 Hz) as the live 16384-point FFT at 48 kHz, for a quarter of the cost.
 */
import {
  TonalityEngine,
  type TonalityEngineConfig,
  type TonalityFrame,
} from "../../src/analysis/engine/tonalityEngine";
import { analyserFrames, concat, notes } from "./synth";

export const SR = 12_000;
export const FFT_SIZE = 4096;
export const FPS = 10;
const HOP = SR / FPS;

/** Run a signal through a fresh engine and return the last frame. */
export function runLive(
  signal: Float32Array,
  cfg: Partial<TonalityEngineConfig> = {},
): TonalityFrame {
  const engine = new TonalityEngine({ framesPerSecond: FPS, ...cfg });
  let frame = engine.snapshot();
  for (const db of analyserFrames(signal, FFT_SIZE, HOP)) frame = engine.processDbSpectrum(db, SR);
  return frame;
}

/** 1.4 s: one analyser window (0.34 s) plus a full 1 s chord window. */
export const CHORD_SECONDS = 1.4;

export const A_MINOR = [57, 60, 64]; // A3 C4 E4

export function triad(root: number, minor: boolean): number[] {
  return [root, root + (minor ? 3 : 4), root + 7];
}

export function chordSignal(midiNotes: number[], opts: { cents?: number } = {}): Float32Array {
  return notes(midiNotes, { sampleRate: SR, seconds: CHORD_SECONDS, ...opts });
}

/** I–IV–V–I (major) or i–iv–V–i (harmonic minor), one second per chord. */
export function cadence(tonic: number, minor: boolean, cents = 0): Float32Array {
  const I = triad(tonic, minor);
  const IV = triad(tonic + 5, minor);
  const V = triad(tonic + 7, false); // raised leading tone in minor
  return concat([I, IV, V, I].map((c) => notes(c, { sampleRate: SR, seconds: 1, cents })));
}
