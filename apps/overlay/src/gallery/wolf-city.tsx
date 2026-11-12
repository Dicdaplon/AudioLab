import { useRef } from "react";

import { SpectrumCity, type Roofline } from "@audiolab/react/stage";

import { WolfBuddy } from "../../../../packages/react/src/stage/wolf/WolfBuddy";

import type { LayoutProps } from "../layouts";

/**
 * The mascot living on the spectrum city (the cam layout's box, 496 × 400,
 * 16 buildings), restless on purpose so the walks, climbs, hiding places
 * and falls show within a minute of the demo synth: short pauses, falls 4 s
 * after it is back up, chatty bubble. The layouts use the calm defaults.
 */
export default function WolfCity({ stage, params }: LayoutProps) {
  const roofline = useRef<Roofline | null>(null);
  return (
    <div style={{ position: "absolute", left: 1424, top: 680, width: 496, height: 400 }}>
      <SpectrumCity
        signals={stage.signals}
        width={496}
        height={400}
        columns={16}
        roofline={roofline}
        wolf={false}
      />
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <WolfBuddy
          signals={stage.signals}
          roofline={roofline}
          area={{ width: 496, height: 400 }}
          notation={params.notation === "fr" ? "fr" : "en"}
          roam={{ pauseSeconds: [1.5, 4], fallGapSeconds: 4, hideChance: 0.9 }}
          brain={{ minGapSeconds: 6, kindCooldownSeconds: 15, warmupSeconds: 2 }}
        />
      </div>
    </div>
  );
}
