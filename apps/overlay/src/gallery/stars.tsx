import { FifthsMandala } from "@audiolab/react/stage";
import { NoteConstellation } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The constellation over a mandala of the same size (scene preset), and alone. */
export default function Stars({ stage, params }: LayoutProps) {
  return (
    <>
      <div style={{ position: "absolute", left: 160, top: 220 }}>
        <FifthsMandala
          signals={stage.signals}
          size={640}
          notation={params.notation === "en" ? "en" : "fr"}
        />
        <div style={{ position: "absolute", inset: 0 }}>
          <NoteConstellation signals={stage.signals} size={640} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 1120, top: 220 }}>
        <NoteConstellation signals={stage.signals} size={640} />
      </div>
    </>
  );
}
