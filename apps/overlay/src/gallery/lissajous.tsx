import { Oscilloscope } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** Phase portraits: the lead (spec size 320×320) and the mix, side by side. */
export default function Lissajous({ stage }: LayoutProps) {
  return (
    <>
      <div style={{ position: "absolute", left: 96, top: 300 }}>
        <Oscilloscope signals={stage.signals} width={320} height={320} mode="lissajous" />
      </div>
      <div style={{ position: "absolute", left: 480, top: 300 }}>
        <Oscilloscope
          signals={stage.signals}
          width={320}
          height={320}
          mode="lissajous"
          source="harmony"
        />
      </div>
    </>
  );
}
