/**
 * Timing budget: how late is a detected note, and how sure can we be?
 * Pure arithmetic, no measurement.
 *
 * For a note to play when a visual target reaches its line (no sound
 * played by the page), two delays shift the detected onset after the
 * target time, and both must be subtracted:
 *
 *   display   the target is drawn at T (rAF) but seen ≈ 1.5 frames later
 *             (composition, scan-out; more on a TV) → the player reacts late
 *   input     the sound reaches the audio thread after the microphone,
 *             converter and driver buffers (not exposed by any web API)
 *
 * Other parts of the chain do not shift timestamps but add uncertainty:
 *
 *   clock     the AudioContext ↔ performance.now() mapping (AudioClockSync)
 *   detector  where the onset detector puts an attack vs where the ear does
 *   strum     for a chord, the spread between its first and last string
 *
 * The capture's buffering and delivery delay do NOT appear: onsets carry
 * their sample-exact frame, so a late batch delays the verdict, never the
 * timestamp. They are reported separately as the reaction delay.
 *
 * Each component carries a source: "measured" (from this session),
 * "reported" (a browser value, trusted loosely) or "assumed" (a typical
 * value with a wide uncertainty). Independent uncertainties add in
 * quadrature: σ = √(Σ σᵢ²). The recommended minimum tolerance is 2σ: a
 * perfectly timed note falls inside ±2σ about 95 % of the time.
 */

export type TimingComponentSource = "measured" | "reported" | "assumed";

export type TimingComponentId =
  "input" | "display" | "clock" | "detector" | "strum" | (string & {});

export interface TimingComponent {
  id: TimingComponentId;
  /** Delay to subtract from detected onsets, in ms (0 if it only adds uncertainty). */
  offsetMs: number;
  /** One standard deviation, in ms. */
  uncertaintyMs: number;
  source: TimingComponentSource;
}

export interface TimingBudget {
  components: readonly TimingComponent[];
  /** Sum of the offsets, in ms: subtract from onset times before comparing to targets. */
  offsetMs: number;
  /** Combined standard deviation, in ms. */
  uncertaintyMs: number;
  /** Narrowest sensible "on time" window, ±ms (2σ). */
  minToleranceMs: number;
  /** True when every offset was measured or reported (none assumed). */
  calibrated: boolean;
}

export function combineTimingComponents(components: readonly TimingComponent[]): TimingBudget {
  let offset = 0;
  let variance = 0;
  let calibrated = true;
  for (const c of components) {
    offset += c.offsetMs;
    variance += c.uncertaintyMs * c.uncertaintyMs;
    if (c.offsetMs !== 0 && c.source === "assumed") calibrated = false;
  }
  const sigma = Math.sqrt(variance);
  return {
    components,
    offsetMs: offset,
    uncertaintyMs: sigma,
    minToleranceMs: 2 * sigma,
    calibrated,
  };
}

export interface TimingBudgetInput {
  /**
   * Input latency reported by the browser (`MediaTrackSettings.latency`,
   * seconds). Ignored outside (0, 0.5]; some browsers report a constant.
   */
  reportedInputLatencySeconds?: number;
  /** Microphone label, used only to spot Bluetooth headsets. */
  deviceLabel?: string;
  /** Measured display frame period (rAF), in ms. Default 16.7. */
  displayFramePeriodMs?: number;
  /** Uncertainty of the clock mapping, in ms (`AudioClockSync.stats().offsetSpreadMs`). */
  clockSpreadMs?: number;
  /** Onset detector precision (one σ), in ms. Default 4 (synthetic plucks, see the tests). */
  detectorUncertaintyMs?: number;
  /** True for chords: adds the strum spread. Default false. */
  strummed?: boolean;
  /** A measured total offset (e.g. a play-along calibration) replacing input + display. */
  calibratedOffsetMs?: number;
  /** Spread of that calibration, in ms. */
  calibrationSpreadMs?: number;
}

/** Typical input latency of a built-in or wired microphone, and its spread. */
export const ASSUMED_INPUT_LATENCY_MS = 10;
export const ASSUMED_INPUT_UNCERTAINTY_MS = 8;
/** A Bluetooth headset microphone (HFP) adds 100–200 ms. */
export const BLUETOOTH_INPUT_LATENCY_MS = 150;
export const BLUETOOTH_INPUT_UNCERTAINTY_MS = 50;

const BLUETOOTH_LABEL = /bluetooth|airpods|hands-?free|headset|buds|\bbt\b/i;

/** True when a device label looks like a Bluetooth headset. */
export function looksLikeBluetooth(label: string | undefined): boolean {
  return label !== undefined && BLUETOOTH_LABEL.test(label);
}

/** The budget of a session from what the browser and the capture tell. */
export function estimateTimingBudget(input: TimingBudgetInput = {}): TimingBudget {
  const components: TimingComponent[] = [];
  const frame = input.displayFramePeriodMs ?? 1000 / 60;

  if (input.calibratedOffsetMs !== undefined) {
    components.push({
      id: "calibration",
      offsetMs: input.calibratedOffsetMs,
      uncertaintyMs: input.calibrationSpreadMs ?? 10,
      source: "measured",
    });
  } else {
    const reported = input.reportedInputLatencySeconds;
    if (looksLikeBluetooth(input.deviceLabel)) {
      components.push({
        id: "input",
        offsetMs: BLUETOOTH_INPUT_LATENCY_MS,
        uncertaintyMs: BLUETOOTH_INPUT_UNCERTAINTY_MS,
        source: "assumed",
      });
    } else if (reported !== undefined && reported > 0 && reported <= 0.5) {
      components.push({
        id: "input",
        offsetMs: reported * 1000,
        uncertaintyMs: Math.max(5, reported * 500),
        source: "reported",
      });
    } else {
      components.push({
        id: "input",
        offsetMs: ASSUMED_INPUT_LATENCY_MS,
        uncertaintyMs: ASSUMED_INPUT_UNCERTAINTY_MS,
        source: "assumed",
      });
    }
    // Drawn at T, composited at the next vsync, scanned out over a frame.
    // The frame period may be measured; the 1.5-frame model is assumed
    // (a monitor's own processing is invisible to the page).
    components.push({
      id: "display",
      offsetMs: 1.5 * frame,
      uncertaintyMs: frame,
      source: "assumed",
    });
  }

  components.push({
    id: "clock",
    offsetMs: 0,
    uncertaintyMs: Math.max(0.5, input.clockSpreadMs ?? 1),
    source: input.clockSpreadMs !== undefined ? "measured" : "assumed",
  });
  components.push({
    id: "detector",
    offsetMs: 0,
    uncertaintyMs: input.detectorUncertaintyMs ?? 4,
    source: "assumed",
  });
  if (input.strummed) {
    components.push({ id: "strum", offsetMs: 0, uncertaintyMs: 12, source: "assumed" });
  }
  return combineTimingComponents(components);
}
