import { FifthsMandala } from "@audiolab/react/stage";

import { BeatRings } from "@audiolab/react/stage";
import type { LayoutProps } from "../layouts";

/** Beat rings around the mandala (preset A centre piece). */
export default function Rings({ stage, params }: LayoutProps) {
  return (
    <>
      <div style={{ position: "absolute", left: 420, top: 0 }}>
        <BeatRings signals={stage.signals} width={1080} height={1080} radius={300} />
      </div>
      <div style={{ position: "absolute", left: 640, top: 220 }}>
        <FifthsMandala
          signals={stage.signals}
          size={640}
          notation={params.notation === "en" ? "en" : "fr"}
        />
      </div>
    </>
  );
}
