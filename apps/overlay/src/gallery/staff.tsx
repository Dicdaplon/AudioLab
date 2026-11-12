import { GuitarTimeline } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The guitar timeline on a staff: note names above, the cam-layout plate below. */
export default function Staff({ stage, params }: LayoutProps) {
  const notation = params.notation === "en" ? "en" : "fr";
  return (
    <>
      <div style={{ position: "absolute", left: 48, top: 580 }}>
        <GuitarTimeline
          signals={stage.signals}
          width={1344}
          height={212}
          view="staff"
          labels="names"
          notation={notation}
        />
      </div>
      <div style={{ position: "absolute", left: 48, top: 820 }}>
        <GuitarTimeline
          signals={stage.signals}
          width={1344}
          height={212}
          view="staff"
          notation={notation}
        />
      </div>
    </>
  );
}
