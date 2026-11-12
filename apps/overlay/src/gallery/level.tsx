import { LevelCapsule } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The level / tempo capsule in the top-right corner (preset A's BPM chip). */
export default function Level({ stage, params }: LayoutProps) {
  return (
    <div style={{ position: "absolute", left: 1416, top: 48 }}>
      <LevelCapsule signals={stage.signals} notation={params.notation === "en" ? "en" : "fr"} />
    </div>
  );
}
