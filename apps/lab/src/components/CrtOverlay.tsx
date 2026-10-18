/**
 * The CRT layer of loloupTech: a lab-only dressing, never part of the SDK.
 *
 * - `useCrt()` (crt.ts) holds the on/off choice (localStorage "crt", default on) and
 *   mirrors it on `<html data-crt>`, which crt.css reads. index.html sets the
 *   attribute before paint so the page never flashes the wrong state.
 * - `<CrtToggle>` is the switch of the top bar.
 * - `<CrtOverlay>` is a fixed, inert layer over the page (scanlines, a slow
 *   rolling band, vignette and rounded glass), plus a one-time power-on per
 *   session. It is aria-hidden and lets every click through: it never stands
 *   between the player and the microphone button.
 *
 * Under prefers-contrast: more or forced colours, crt.css hides the layer,
 * the glow and the switch; under prefers-reduced-motion nothing moves and
 * the power-on is skipped.
 */

import { useCallback, useEffect, useState } from "react";

const BOOT_KEY = "crt-booted";

export function CrtToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      className="al-btn al-btn--quiet lab-crt-toggle"
      aria-pressed={on}
      onClick={() => onChange(!on)}
    >
      <span className="lab-crt-toggle__screen" aria-hidden="true" />
      <span className="lab-crt-toggle__word">CRT</span>
      <span className="al-visually-hidden"> screen effect</span>
    </button>
  );
}

/** True once the power-on has played in this tab (or cannot be remembered). */
function bootedAlready(): boolean {
  try {
    return sessionStorage.getItem(BOOT_KEY) === "1";
  } catch {
    return true;
  }
}

function reducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function CrtOverlay({ on }: { on: boolean }) {
  const [booting, setBooting] = useState(() => on && !bootedAlready() && !reducedMotion());

  const finish = useCallback(() => {
    setBooting(false);
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* nothing to remember */
    }
  }, []);

  useEffect(() => {
    if (!booting) return;
    const done = finish;
    // Any key or click skips it; a fallback timer ends it if no animation
    // event arrives (background tab, an engine without animations).
    const timer = window.setTimeout(done, 1600);
    window.addEventListener("pointerdown", done, { once: true });
    window.addEventListener("keydown", done, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", done);
      window.removeEventListener("keydown", done);
    };
  }, [booting, finish]);

  if (!on) return null;
  return (
    <div className="crt" aria-hidden="true">
      <div className="crt__scan" />
      <div className="crt__roll" />
      <div className="crt__glass" />
      {booting && (
        <div
          className="crt__boot"
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) finish();
          }}
        />
      )}
    </div>
  );
}
