import { ChordPlate } from "@audiolab/react/stage";

import { ChordShockwave } from "@audiolab/react/stage";
import type { LayoutProps } from "../layouts";

const LEFT = 1296;
const TOP = 96;
const SIZE = 640;

/** Preset B: the wave leaves the chord plate's centre (under it) and never covers the webcam. */
export default function ShockwaveCam({ stage, params }: LayoutProps) {
  const { cam } = params;
  return (
    <>
      <div style={{ position: "absolute", left: LEFT, top: TOP, pointerEvents: "none" }}>
        <ChordShockwave
          signals={stage.signals}
          width={SIZE}
          height={SIZE}
          maxRadius={260}
          notation={params.notation === "en" ? "en" : "fr"}
          clip={{ x: cam.x - LEFT, y: cam.y - TOP, w: cam.w, h: cam.h }}
        />
      </div>
      <div style={{ position: "absolute", left: 1344, top: 300 }}>
        <ChordPlate
          reading={stage.chord}
          songKey={stage.key.key}
          notation={params.notation}
          size={96}
        />
      </div>
    </>
  );
}
