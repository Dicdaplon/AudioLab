import { Oscilloscope } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The note's waveform as a ribbon (lead, then the mix), spec size 1728×96. */
export default function Scope({ stage }: LayoutProps) {
  return (
    <>
      <div style={{ position: "absolute", left: 96, top: 640 }}>
        <Oscilloscope signals={stage.signals} width={1728} height={96} />
      </div>
      <div style={{ position: "absolute", left: 96, top: 800 }}>
        <Oscilloscope signals={stage.signals} width={1728} height={96} source="harmony" />
      </div>
    </>
  );
}
