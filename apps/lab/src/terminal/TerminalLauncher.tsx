/**
 * The question at the end of the transmission: Enter (or a tap) boots the
 * conversational terminal. Until then its code and its model stay on the
 * server: nothing is downloaded for visitors who only read.
 */
import { Suspense, lazy, useEffect, useState } from "react";

const TerminalChat = lazy(() => import("./TerminalChat"));

/** Enter on the page counts, unless it is meant for a field, a link or a button. */
function isForSomethingElse(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("input, textarea, select, button, a, summary, [contenteditable]") !== null
  );
}

export function TerminalLauncher() {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (launched) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || isForSomethingElse(event.target)) return;
      event.preventDefault();
      setLaunched(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [launched]);

  if (launched)
    return (
      <Suspense fallback={<p className="lt-term__status">LOADING TERMINAL…</p>}>
        <TerminalChat />
      </Suspense>
    );

  return (
    <button type="button" className="about__launch" onClick={() => setLaunched(true)}>
      Would you like to launch the conversational terminal? <kbd>(press Enter)</kbd>
    </button>
  );
}
