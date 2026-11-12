import { HarmonyWell } from "@audiolab/react/stage";
import type { LayoutProps } from "../layouts";

/** The harmony well (bonus): chord functions as orbits around the tonic. */
export default function Well({ stage, params }: LayoutProps) {
  return (
    <div style={{ position: "absolute", left: 600, top: 180 }}>
      <HarmonyWell
        signals={stage.signals}
        size={720}
        notation={params.notation === "en" ? "en" : "fr"}
      />
    </div>
  );
}
