/** The on/off choice of the CRT layer (see components/CrtOverlay.tsx). */

import { useEffect, useState } from "react";

const STORAGE_KEY = "crt";

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true; // storage blocked: the default
  }
}

export function useCrt(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(readStored);

  useEffect(() => {
    document.documentElement.dataset.crt = on ? "on" : "off";
  }, [on]);

  const set = (next: boolean) => {
    setOn(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      /* storage blocked: the choice lasts for this page only */
    }
  };
  return [on, set];
}
