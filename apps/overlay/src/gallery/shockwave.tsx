import { FifthsMandala } from "@audiolab/react/stage";

import { ChordShockwave } from "@audiolab/react/stage";
import type { LayoutProps } from "../layouts";

/** Chord shockwave out of the mandala's centre (preset A). */
export default function Shockwave({ stage, params }: LayoutProps) {
  const notation = params.notation === "en" ? "en" : "fr";
  return (
    <>
      <div style={{ position: "absolute", left: 640, top: 220 }}>
        <FifthsMandala signals={stage.signals} size={640} notation={notation} />
      </div>
      <div style={{ position: "absolute", left: 420, top: 0 }}>
        <ChordShockwave
          signals={stage.signals}
          width={1080}
          height={1080}
          maxRadius={420}
          notation={notation}
        />
      </div>
    </>
  );
}
