import { FifthsSky } from "@audiolab/react/stage";
import { SpectrumCity } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The sky of fifths over the spectrum city: the whole night scene. */
export default function Sky({ stage, params }: LayoutProps) {
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 120 }}>
        <FifthsSky
          signals={stage.signals}
          width={1920}
          height={720}
          notation={params.notation === "en" ? "en" : "fr"}
        />
      </div>
      <div style={{ position: "absolute", left: 0, top: 872 }}>
        <SpectrumCity signals={stage.signals} width={1920} height={208} />
      </div>
    </>
  );
}
