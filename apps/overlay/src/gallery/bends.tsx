import { GuitarTimeline } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/**
 * Bends and vibratos side by side: the tab with note names, the tab with
 * frets (cam-layout size) and the staff at the band size.
 */
export default function Bends({ stage, params }: LayoutProps) {
  const notation = params.notation === "en" ? "en" : "fr";
  return (
    <>
      <div style={{ position: "absolute", left: 48, top: 104 }}>
        <GuitarTimeline
          signals={stage.signals}
          width={1104}
          height={192}
          view="staff"
          labels="names"
          notation={notation}
        />
      </div>
      <div style={{ position: "absolute", left: 48, top: 340 }}>
        <GuitarTimeline
          signals={stage.signals}
          width={1344}
          height={212}
          labels="names"
          notation={notation}
        />
      </div>
      <div style={{ position: "absolute", left: 48, top: 820 }}>
        <GuitarTimeline signals={stage.signals} width={1344} height={212} notation={notation} />
      </div>
    </>
  );
}
