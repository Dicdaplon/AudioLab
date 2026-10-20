/** The latency set by ear on this device (see LatencyTest.tsx), kept across visits. */

import { useState } from "react";

const STORAGE_KEY = "audiolab-latency";

export interface StoredLatency {
  offsetMs: number;
  spreadMs: number;
}

function readStored(): StoredLatency | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<StoredLatency>;
    return typeof v.offsetMs === "number" && typeof v.spreadMs === "number"
      ? { offsetMs: v.offsetMs, spreadMs: v.spreadMs }
      : null;
  } catch {
    return null; // storage blocked or garbled: nothing set
  }
}

export function useStoredLatency(): [StoredLatency | null, (v: StoredLatency | null) => void] {
  const [value, setValue] = useState(readStored);
  const set = (next: StoredLatency | null) => {
    setValue(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage blocked: the setting lasts for this page only */
    }
  };
  return [value, set];
}
