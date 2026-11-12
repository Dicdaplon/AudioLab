import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/vt323/latin-400.css";
import "@fontsource/silkscreen/latin-400.css";
import "@fontsource/pixelify-sans/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/source-serif-4/latin-600-italic.css";
import App from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("missing #root element");

// Fonts first: text must not jump from a fallback face in the middle of a live.
void Promise.all(
  ["VT323", "Silkscreen", "Pixelify Sans", "IBM Plex Mono"].map((f) =>
    document.fonts.load(`32px "${f}"`),
  ),
).finally(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
