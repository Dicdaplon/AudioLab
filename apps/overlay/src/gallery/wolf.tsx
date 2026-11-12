import { WolfBuddy } from "../../../../packages/react/src/stage/wolf/WolfBuddy";

import type { LayoutProps } from "../layouts";

/**
 * The mascot in the bottom-right corner, bubble opening to the left. This
 * gallery view is chatty on purpose (a phrase every 6 s at most, short
 * cooldowns, sleep after 12 s) so it can be tried with the demo synth; the
 * component's defaults are much quieter (one phrase per 25 s at most).
 */
export default function Wolf({ stage, params }: LayoutProps) {
  return (
    <div style={{ position: "absolute", right: 48, bottom: 48 }}>
      <WolfBuddy
        signals={stage.signals}
        width={400}
        height={192}
        side="left"
        notation={params.notation === "fr" ? "fr" : "en"}
        brain={{
          minGapSeconds: 6,
          kindCooldownSeconds: 15,
          warmupSeconds: 2,
          silenceSeconds: 6,
          sleepAfterSeconds: 12,
          tumbleGapSeconds: 8,
        }}
      />
    </div>
  );
}
