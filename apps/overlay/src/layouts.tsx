/**
 * The three page layouts (1920×1080), v2: one hero (the chord), one ambient
 * layer at most, the webcam as the star; everything else is opt-in through
 * `extras=`. Later children paint over earlier ones: ambient first, plates
 * last.
 */

import { useRef, type ReactNode } from "react";

import {
  AttackField,
  BeatRings,
  ChordPlate,
  ChordRibbon,
  ChordShockwave,
  FifthsMandala,
  GuitarTimeline,
  HarmonicAurora,
  KeyPlate,
  NoteConstellation,
  Oscilloscope,
  PawTrail,
  Plate,
  SpectrumCity,
  STAGE_THEME,
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

/** The spectrum city, optionally with paw prints or fireflies on its roofs. */
function City({
  stage,
  x = 0,
  y,
  width,
  height,
  columns,
  walkers = null,
}: {
  stage: StageState;
  x?: number;
  y: number;
  width: number;
  height: number;
  columns?: number;
  walkers?: "paws" | "fireflies" | null;
}) {
  const roofline = useRef<Roofline | null>(null);
  return (
    <div style={{ position: "absolute", left: x, top: y, width, height }}>
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
            ground={(gx) => roofline.current?.roofAt(gx) ?? height - 8}
          />
        </div>
      )}
    </div>
  );
}

function notationOf(params: OverlayParams) {
  return params.notation === "en" ? ("en" as const) : ("fr" as const);
}

/** Webcam top-left (1344×756), the readings in a right column, the tablature underneath. */
export function CamLayout({ stage, params }: LayoutProps) {
  const key = stage.key.key;
  const fr = notationOf(params);
  const cam = params.cam;
  const extras = params.extras;
  return (
    <>
      {extras.has("embers") && (
        <AttackField
          signals={stage.signals}
          width={1920}
          height={1080}
          clip={{ x: cam.x, y: cam.y, w: cam.w, h: cam.h }}
        />
      )}
      {extras.has("mandala") ? (
        <At x={1448} y={680}>
          <FifthsMandala signals={stage.signals} size={400} notation={fr} />
        </At>
      ) : (
        <City
          stage={stage}
          x={1424}
          y={680}
          width={496}
          height={400}
          columns={16}
          walkers={extras.has("paws") ? "paws" : null}
        />
      )}
      {/* The chord change ripples inside the chord plate, without a text stamp. */}
      <At x={1424} y={236}>
        <ChordShockwave
          signals={stage.signals}
          width={448}
          height={264}
          maxRadius={220}
          label={false}
        />
      </At>
      <At x={1424} y={48}>
        <KeyPlate
          reading={stage.key}
          notation={params.notation}
          width={448}
          size={64}
          tempo={stage.tempo}
          live={stage.playing}
        />
      </At>
      <At x={1424} y={236}>
        <ChordPlate
          reading={stage.chord}
          songKey={key}
          notation={params.notation}
          width={448}
          size={140}
        />
      </At>
      <At x={1424} y={488}>
        <TunerPlate
          note={stage.note}
          songKey={key}
          notation={params.notation}
          width={448}
          size={64}
        />
      </At>
      <At x={cam.x} y={cam.y + cam.h + 16}>
        {extras.has("ribbon") ? (
          <ChordRibbon reading={stage.chord} songKey={key} width={cam.w} notation={fr} />
        ) : (
          <GuitarTimeline
            signals={stage.signals}
            width={cam.w}
            height={212}
            labels={params.tabLabels}
            notation={fr}
          />
        )}
      </At>
    </>
  );
}

/** No webcam (intro, breaks, listening): the mandala in the middle, still one ambient layer. */
export function SceneLayout({ stage, params }: LayoutProps) {
  const key = stage.key.key;
  const fr = notationOf(params);
  const extras = params.extras;
  return (
    <>
      {extras.has("embers") && <AttackField signals={stage.signals} width={1920} height={1080} />}
      {extras.has("aurora") ? (
        <HarmonicAurora signals={stage.signals} width={1920} height={304} />
      ) : (
        <City stage={stage} y={952} width={1920} height={128} walkers="fireflies" />
      )}
      <At x={510} y={-42}>
        <BeatRings signals={stage.signals} width={900} height={900} radius={280} />
      </At>
      <At x={680} y={128}>
        <FifthsMandala signals={stage.signals} size={560} notation={fr} />
      </At>
      <At x={680} y={128}>
        <NoteConstellation signals={stage.signals} size={560} />
      </At>
      {extras.has("scope") && (
        <At x={96} y={420}>
          <Oscilloscope signals={stage.signals} width={288} height={288} mode="lissajous" />
        </At>
      )}
      <At x={48} y={48}>
        <KeyPlate
          reading={stage.key}
          notation={params.notation}
          width={560}
          tempo={stage.tempo}
          live={stage.playing}
        />
      </At>
      {params.title && (
        <At x={48} y={300}>
          <Plate label={fr === "fr" ? "Morceau" : "Song"} width={560}>
            <div
              style={{
                font: `40px/1.1 ${STAGE_THEME.fonts.hero}`,
                color: STAGE_THEME.ink,
                marginTop: 4,
              }}
            >
              {params.title}
            </div>
          </Plate>
        </At>
      )}
      <At x={1376} y={232}>
        <ChordPlate reading={stage.chord} songKey={key} notation={params.notation} width={496} />
      </At>
      <At x={1376} y={520}>
        <TunerPlate
          note={stage.note}
          songKey={key}
          notation={params.notation}
          width={496}
          size={72}
        />
      </At>
      <At x={96} y={728}>
        <GuitarTimeline
          signals={stage.signals}
          width={1728}
          height={216}
          labels={params.tabLabels}
          notation={fr}
        />
      </At>
    </>
  );
}

/** Plates a little more opaque over a full-frame webcam. */
const BAND_THEME = { ...STAGE_THEME, plate: "rgba(9, 12, 11, 0.88)" };

/** Full-frame webcam: three blocks in a lower third, the key as a corner chip. */
export function BandLayout({ stage, params }: LayoutProps) {
  const key = stage.key.key;
  const fr = notationOf(params);
  return (
    <>
      {params.extras.has("embers") && (
        <AttackField
          signals={stage.signals}
          width={1920}
          height={1080}
          clip={{ x: 320, y: 0, w: 1280, h: 820 }}
        />
      )}
      <At x={1472} y={48}>
        <KeyPlate
          reading={stage.key}
          notation={params.notation}
          width={400}
          size={44}
          tempo={stage.tempo}
          live={stage.playing}
          compact
          theme={BAND_THEME}
        />
      </At>
      <At x={48} y={840}>
        <ChordPlate
          reading={stage.chord}
          songKey={key}
          notation={params.notation}
          width={344}
          size={96}
          theme={BAND_THEME}
        />
      </At>
      <At x={408} y={840}>
        <GuitarTimeline
          signals={stage.signals}
          width={1104}
          height={192}
          labels={params.tabLabels}
          notation={fr}
          theme={BAND_THEME}
        />
      </At>
      <At x={1528} y={840}>
        <TunerPlate
          note={stage.note}
          songKey={key}
          notation={params.notation}
          width={344}
          size={56}
          theme={BAND_THEME}
        />
      </At>
    </>
  );
}
