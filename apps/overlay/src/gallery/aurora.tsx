import { HarmonicAurora } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The aurora across the top of the screen (scene preset: 1920×300). */
export default function Aurora({ stage }: LayoutProps) {
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      <HarmonicAurora signals={stage.signals} width={1920} height={304} />
    </div>
  );
}
