/**
 * The three page layouts (1920×1080). Later children paint over earlier
 * ones: background visuals first, plates last.
 */

import { useRef, type ReactNode } from "react";

import {
  AttackField,
  BeatRings,
  ChordPlate,
  ChordRibbon,
  ChordShockwave,
  FifthsMandala,
  HarmonicAurora,
  KeyPlate,
  LevelCapsule,
  NoteConstellation,
  Oscilloscope,
  PawTrail,
  SpectrumCity,
  TunerPlate,
  type Roofline,
  type StageState,
} from "@audiolab/react/stage";

import type { OverlayParams } from "./params";

export interface LayoutProps {
  stage: StageState;
  params: OverlayParams;
}

function At({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <div style={{ position: "absolute", left: x, top: y }}>{children}</div>;
}

/** The spectrum city along the bottom, with paw prints or fireflies on its roofs. */
function City({
  stage,
  y,
  width = 1920,
  height,
  columns,
  walkers = "paws",
}: {
  stage: StageState;
  y: number;
  width?: number;
  height: number;
  columns?: number;
  walkers?: "paws" | "fireflies" | null;
}) {
  const roofline = useRef<Roofline | null>(null);
  return (
    <div style={{ position: "absolute", left: 0, top: y, width, height }}>
      <SpectrumCity
        signals={stage.signals}
        width={width}
        height={height}
        columns={columns}
        roofline={roofline}
      />
      {walkers && (
        <div style={{ position: "absolute", inset: 0 }}>
          <PawTrail
            signals={stage.signals}
            width={width}
            height={height}
            mode={walkers}
            ground={(x) => roofline.current?.roofAt(x) ?? height - 8}
          />
        </div>
      )}
    </div>
  );
}

/** Webcam in the top-left corner; plates and the mandala in the right column. */
export function CamLayout({ stage, params }: LayoutProps) {
  const key = stage.key.key;
  const fr = params.notation === "en" ? "en" : "fr";
  const cam = params.cam;
  return (
    <>
      <AttackField
        signals={stage.signals}
        width={1920}
        height={1080}
        clip={{ x: cam.x, y: cam.y, w: cam.w, h: cam.h }}
      />
      <City stage={stage} y={880} height={200} />
      <At x={1328} y={164}>
        <BeatRings signals={stage.signals} width={560} height={560} radius={176} />
      </At>
      <At x={1432} y={268}>
        <FifthsMandala signals={stage.signals} size={352} notation={fr} />
      </At>
      <At x={1348} y={472}>
        <ChordShockwave
          signals={stage.signals}
          width={520}
          height={520}
          maxRadius={260}
          notation={fr}
          clip={{ x: cam.x - 1348, y: cam.y - 472, w: cam.w, h: cam.h }}
        />
      </At>
      <At x={1344} y={48}>
        <KeyPlate reading={stage.key} notation={params.notation} size={88} />
      </At>
      <At x={1344} y={632}>
        <ChordPlate reading={stage.chord} songKey={key} notation={params.notation} size={96} />
      </At>
      <At x={1344} y={850}>
        <TunerPlate note={stage.note} songKey={key} notation={params.notation} size={64} />
      </At>
      <At x={cam.x} y={cam.y + cam.h + 16}>
        <ChordRibbon reading={stage.chord} songKey={key} width={cam.w} notation={fr} />
      </At>
      <At x={48} y={964}>
        <LevelCapsule signals={stage.signals} notation={fr} />
      </At>
    </>
  );
}

/** No webcam: the music fills the screen (intro, breaks, listening). */
export function SceneLayout({ stage, params }: LayoutProps) {
  const key = stage.key.key;
  const fr = params.notation === "en" ? "en" : "fr";
  return (
    <>
      <HarmonicAurora signals={stage.signals} width={1920} height={304} />
      <AttackField signals={stage.signals} width={1920} height={1080} />
      <City stage={stage} y={880} height={200} walkers="fireflies" />
      <At x={460} y={-50}>
        <BeatRings signals={stage.signals} width={1000} height={1000} radius={320} />
      </At>
      <At x={640} y={130}>
        <FifthsMandala signals={stage.signals} size={640} notation={fr} />
      </At>
      <At x={640} y={130}>
        <NoteConstellation signals={stage.signals} size={640} />
      </At>
      <At x={540} y={30}>
        <ChordShockwave
          signals={stage.signals}
          width={840}
          height={840}
          maxRadius={420}
          notation={fr}
        />
      </At>
      <At x={96} y={392}>
        <Oscilloscope signals={stage.signals} width={384} height={384} mode="lissajous" />
      </At>
      <At x={48} y={48}>
        <KeyPlate reading={stage.key} notation={params.notation} width={560} />
      </At>
      <At x={1376} y={280}>
        <ChordPlate reading={stage.chord} songKey={key} notation={params.notation} width={496} />
      </At>
      <At x={1376} y={560}>
        <TunerPlate
          note={stage.note}
          songKey={key}
          notation={params.notation}
          width={496}
          size={80}
        />
      </At>
      <At x={96} y={790}>
        <ChordRibbon reading={stage.chord} songKey={key} width={1728} notation={fr} />
      </At>
      <At x={1416} y={48}>
        <LevelCapsule signals={stage.signals} notation={fr} />
      </At>
    </>
  );
}

/** Full-frame webcam: a minimal lower third, the key in the top-right corner. */
export function BandLayout({ stage, params }: LayoutProps) {
  const key = stage.key.key;
  const fr = params.notation === "en" ? "en" : "fr";
  return (
    <>
      {/* Full-frame webcam: embers only around the face and the guitar. */}
      <AttackField
        signals={stage.signals}
        width={1920}
        height={1080}
        clip={{ x: 320, y: 0, w: 1280, h: 856 }}
      />
      <At x={472} y={968}>
        <SpectrumCity signals={stage.signals} width={896} height={64} columns={32} />
      </At>
      <At x={48} y={744}>
        <ChordShockwave
          signals={stage.signals}
          width={400}
          height={400}
          maxRadius={200}
          notation={fr}
        />
      </At>
      <At x={1392} y={48}>
        <KeyPlate reading={stage.key} notation={params.notation} width={480} size={64} />
      </At>
      <At x={48} y={856}>
        <ChordPlate
          reading={stage.chord}
          songKey={key}
          notation={params.notation}
          width={400}
          size={88}
        />
      </At>
      <At x={472} y={880}>
        <ChordRibbon reading={stage.chord} songKey={key} width={896} height={56} notation={fr} />
      </At>
      <At x={1392} y={880}>
        <TunerPlate
          note={stage.note}
          songKey={key}
          notation={params.notation}
          width={480}
          size={56}
        />
      </At>
    </>
  );
}
