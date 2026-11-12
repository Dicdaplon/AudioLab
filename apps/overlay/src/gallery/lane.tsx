import { NoteLane } from "@audiolab/react/stage";
import type { LayoutProps } from "../layouts";

/** The note lane under the webcam (preset B variant), and a taller one. */
export default function Lane({ stage, params }: LayoutProps) {
  const notation = params.notation === "en" ? "en" : "fr";
  return (
    <>
      <div
        style={{ position: "absolute", left: params.cam.x, top: params.cam.y + params.cam.h + 16 }}
      >
        <NoteLane signals={stage.signals} width={params.cam.w} height={200} notation={notation} />
      </div>
      <div style={{ position: "absolute", left: 1344, top: 48 }}>
        <NoteLane signals={stage.signals} width={528} height={480} notation={notation} />
      </div>
    </>
  );
}
