"use client";

import { memo } from "react";

import { Icon } from "../ui/Icon";

export type MicState = "idle" | "starting" | "live" | "error" | "unsupported";

const BADGE: Record<MicState, string> = {
  idle: "Mic off",
  starting: "Starting",
  live: "Live",
  error: "Error",
  unsupported: "Unavailable",
};

interface MicTransportProps {
  state: MicState;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

/**
 * The microphone transport in the top bar: the live LED and the
 * start/stop/reset actions. Visible on every tab.
 */
export const MicTransport = memo(function MicTransport({
  state,
  onStart,
  onStop,
  onReset,
}: MicTransportProps) {
  const live = state === "live";
  return (
    <div className="transport">
      <span className="badge badge--live" data-state={state} role="status">
        <span className="transport__text">{BADGE[state]}</span>
      </span>
      {live ? (
        <button type="button" className="btn btn--danger btn--touch" onClick={onStop}>
          <Icon name="stop" />
          Stop
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--accent btn--touch"
          onClick={onStart}
          disabled={state === "starting" || state === "unsupported"}
        >
          <Icon name="mic" />
          Start mic
        </button>
      )}
      <button
        type="button"
        className="btn btn--quiet"
        onClick={onReset}
        title="Clears the analysis buffers (chroma windows and peak memory); the microphone stays on."
      >
        <Icon name="reset" />
        <span className="transport__text">Reset</span>
      </button>
    </div>
  );
});
