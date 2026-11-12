import { useRef } from "react";

import { PawTrail } from "@audiolab/react/stage";
import { SpectrumCity, type Roofline } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** Fireflies rising from the spectrum city on every attack. */
export default function Fireflies({ stage }: LayoutProps) {
  const roofline = useRef<Roofline | null>(null);
  return (
    <div style={{ position: "absolute", left: 0, top: 680, width: 1920, height: 400 }}>
      <SpectrumCity signals={stage.signals} width={1920} height={400} roofline={roofline} />
      <div style={{ position: "absolute", inset: 0 }}>
        <PawTrail
          mode="fireflies"
          signals={stage.signals}
          width={1920}
          height={400}
          ground={(x) => roofline.current?.roofAt(x) ?? 392}
        />
      </div>
    </div>
  );
}
