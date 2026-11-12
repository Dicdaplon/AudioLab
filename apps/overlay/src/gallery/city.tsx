import { SpectrumCity } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The spectrum city across the bottom of the screen (preset A size). */
export default function City({ stage }: LayoutProps) {
  return (
    <div style={{ position: "absolute", left: 0, top: 872 }}>
      <SpectrumCity signals={stage.signals} width={1920} height={208} />
    </div>
  );
}
