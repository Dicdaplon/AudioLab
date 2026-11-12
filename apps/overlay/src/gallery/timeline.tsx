import { GuitarTimeline } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The guitar timeline alone, at its cam-layout size, under the webcam. */
export default function Timeline({ stage, params }: LayoutProps) {
  return (
    <div style={{ position: "absolute", left: 48, top: 820 }}>
      <GuitarTimeline
        signals={stage.signals}
        width={1344}
        height={212}
        notation={params.notation === "en" ? "en" : "fr"}
      />
    </div>
  );
}
