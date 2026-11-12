import { useRef } from "react";

import { PawTrail } from "@audiolab/react/stage";
import { SpectrumCity, type Roofline } from "@audiolab/react/stage";

import type { LayoutProps } from "../layouts";

/** Paw prints walking on the spectrum city's roofs (the city at the bottom, the trail over it). */
export default function Paws({ stage }: LayoutProps) {
  const roofline = useRef<Roofline | null>(null);
  return (
    <div style={{ position: "absolute", left: 0, top: 832, width: 1920, height: 248 }}>
      <SpectrumCity signals={stage.signals} width={1920} height={248} roofline={roofline} />
      <div style={{ position: "absolute", inset: 0 }}>
        <PawTrail
          signals={stage.signals}
          width={1920}
          height={248}
          ground={(x) => roofline.current?.roofAt(x) ?? 240}
        />
      </div>
    </div>
  );
}
