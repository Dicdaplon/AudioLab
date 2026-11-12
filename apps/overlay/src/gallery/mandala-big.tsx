import { FifthsMandala } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The mandala alone, large, for checking it (and an example gallery view). */
export default function MandalaBig({ stage, params }: LayoutProps) {
  return (
    <div style={{ position: "absolute", left: 640, top: 220 }}>
      <FifthsMandala
        signals={stage.signals}
        size={640}
        notation={params.notation === "en" ? "en" : "fr"}
      />
    </div>
  );
}
