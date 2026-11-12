import { ChordTunnel } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** The chord tunnel (bonus visual), 640 px square. */
export default function Tunnel({ stage, params }: LayoutProps) {
  return (
    <div style={{ position: "absolute", left: 640, top: 220 }}>
      <ChordTunnel
        signals={stage.signals}
        size={640}
        notation={params.notation === "en" ? "en" : "fr"}
      />
    </div>
  );
}
