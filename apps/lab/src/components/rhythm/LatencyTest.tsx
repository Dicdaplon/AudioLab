import { useEffect } from "react";
import { LATENCY_TEST } from "@audiolab/core";
import { BeatLights, type LatencyTestControls } from "@audiolab/react";

import type { StoredLatency } from "./latencyStore";

interface LatencyTestProps {
  test: LatencyTestControls;
  stored: StoredLatency | null;
  onStore: (v: StoredLatency | null) => void;
  running: boolean;
  /** Called before the test starts (stops the exercise). */
  onStart: () => void;
  now: () => number | null;
}

/** "Sync the click": play on a few clicks; the delay you hear them with is measured and kept. */
export function LatencyTest({ test, stored, onStore, running, onStart, now }: LatencyTestProps) {
  const { result } = test;

  useEffect(() => {
    if (result?.reliable) onStore({ offsetMs: result.offsetMs, spreadMs: result.spreadMs });
    // onStore changes every render; only a new result is stored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  let message: string;
  if (test.active) {
    message = `Listen to ${LATENCY_TEST.countIn} clicks, then play on each click: ${Math.min(test.taps, LATENCY_TEST.clicks)} of ${LATENCY_TEST.clicks}.`;
  } else if (result && !result.reliable) {
    message = `${result.taps} steady notes out of ${LATENCY_TEST.clicks}. Play on every click, as evenly as you can, and try again.`;
  } else if (stored) {
    message = "Click synced with your headphones, kept on this device.";
  } else {
    message = `Bluetooth headphones play the click late. Sync them once: listen to ${LATENCY_TEST.countIn} clicks, then play on each of the next ${LATENCY_TEST.clicks} (a muted strum or a tap on the guitar is fine).`;
  }

  return (
    <div className="rhythm__latency">
      <p className="rhythm__legend" role="status">
        {message}
      </p>
      <div className="rhythm__latency-controls">
        {test.active ? (
          <>
            <BeatLights grid={test.grid} now={now} />
            <button type="button" className="al-btn" onClick={test.stop}>
              Stop
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="al-btn"
              onClick={() => {
                onStart();
                test.start();
              }}
              disabled={!running}
            >
              {stored ? "Sync again" : "Sync the click"}
            </button>
            {stored && (
              <button type="button" className="al-btn" onClick={() => onStore(null)}>
                Forget it
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
