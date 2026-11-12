import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import {
  ChordPlate,
  ChordRibbon,
  FifthsMandala,
  KeyPlate,
  STAGE_THEME,
  TunerPlate,
  useStageSignals,
  type StageState,
} from "@audiolab/react/stage";

import { BandLayout, CamLayout, SceneLayout, type LayoutProps } from "./layouts";
import { readParams, type OverlayParams } from "./params";
import { useOverlaySessions, type OverlaySessions } from "./useOverlaySessions";

const W = 1920;
const H = 1080;

/**
 * Extra views, one file each in src/gallery/ (`?view=<file name>`): a
 * default-exported component taking `{ stage, params }`.
 */
const GALLERY = Object.fromEntries(
  Object.entries(
    import.meta.glob<{ default: (props: LayoutProps) => ReactNode }>("./gallery/*.tsx", {
      eager: true,
    }),
  ).map(([path, mod]) => [path.replace(/^.*\/(.*)\.tsx$/, "$1"), mod.default]),
);

/** One element alone, top-left, for an OBS source of its own (`?view=`). */
function SingleView({ stage, params, view }: LayoutProps & { view: string }) {
  const key = stage.key.key;
  const Extra = GALLERY[view];
  if (Extra) return <Extra stage={stage} params={params} />;
  switch (view) {
    case "key":
      return <KeyPlate reading={stage.key} notation={params.notation} />;
    case "chord":
      return <ChordPlate reading={stage.chord} songKey={key} notation={params.notation} />;
    case "tuner":
      return <TunerPlate note={stage.note} songKey={key} notation={params.notation} />;
    case "ribbon":
      return (
        <ChordRibbon
          reading={stage.chord}
          songKey={key}
          width={1248}
          notation={params.notation === "en" ? "en" : "fr"}
        />
      );
    case "mandala":
      return (
        <FifthsMandala
          signals={stage.signals}
          size={640}
          notation={params.notation === "en" ? "en" : "fr"}
        />
      );
    default:
      return null;
  }
}

/** Stand-in for the stream behind the overlay (previews and screenshots only). */
function Backdrop({ params }: { params: OverlayParams }) {
  const cam: CSSProperties = {
    position: "absolute",
    left: params.cam.x,
    top: params.cam.y,
    width: params.cam.w,
    height: params.cam.h,
    background: "linear-gradient(160deg, #3b3a36 0%, #57534a 45%, #2a2b28 100%)",
    color: "#ffffff55",
    font: "32px sans-serif",
    display: "grid",
    placeItems: "center",
  };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, #1d2427 0%, #101314 100%)",
      }}
    >
      {params.layout === "cam" && <div style={cam}>webcam</div>}
      {params.layout === "band" && (
        <div style={{ ...cam, left: 0, top: 0, width: W, height: H }}>webcam</div>
      )}
    </div>
  );
}

function DebugPanel({ sessions, stage }: { sessions: OverlaySessions; stage: StageState }) {
  const t = STAGE_THEME;
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        bottom: 48,
        padding: 16,
        background: t.plate,
        border: `4px solid ${t.plateBorder}`,
        font: `18px ${t.fonts.mono}`,
        color: t.ink,
        maxWidth: 900,
      }}
    >
      <div>
        harmonie :{" "}
        {sessions.devices.harmony?.label || (sessions.harmony ? "entrée par défaut / démo" : "—")}
      </div>
      <div>
        notes :{" "}
        {sessions.devices.notes?.label || (sessions.notes ? "entrée par défaut / démo" : "—")}
      </div>
      <div>
        niveau : {Number.isFinite(stage.levelDb) ? `${stage.levelDb.toFixed(1)} dB` : "silence"}
      </div>
      <div>
        tempo :{" "}
        {stage.tempo
          ? `${stage.tempo.bpm.toFixed(0)} BPM (${stage.tempo.confidence.toFixed(2)})`
          : "—"}
      </div>
      {sessions.inputs.length > 0 && (
        <div style={{ color: t.inkMuted, marginTop: 8 }}>
          entrées : {sessions.inputs.map((i) => i.label || i.deviceId.slice(0, 8)).join(" · ")}
        </div>
      )}
      {sessions.errors.map((e) => (
        <div key={e} style={{ color: t.bad }}>
          {e}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const params = readParams(window.location.search);
  const sessions = useOverlaySessions(params);
  const stage = useStageSignals(sessions.harmony, sessions.notes, {
    songSeconds: params.songSeconds,
    chords: params.chords,
  });
  // Info panel: shown with debug=1 or on errors, never with hud=0; D toggles it.
  const [hud, setHud] = useState(params.hud);

  // R starts the song over, D shows or hides the info panel (OBS: right-click
  // the source › Interact, then the key).
  const { reset } = stage;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") reset();
      if (e.key === "d" || e.key === "D") setHud((h) => !h);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);

  const Layout =
    params.layout === "scene" ? SceneLayout : params.layout === "band" ? BandLayout : CamLayout;
  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden" }}>
      {params.background && <Backdrop params={params} />}
      {params.view ? (
        <SingleView stage={stage} params={params} view={params.view} />
      ) : (
        <Layout stage={stage} params={params} />
      )}
      {hud && (params.debug || sessions.errors.length > 0) && (
        <DebugPanel sessions={sessions} stage={stage} />
      )}
    </div>
  );
}
