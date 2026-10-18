import { useEffect, useState } from "react";
import {
  ANALYSIS_DEFAULTS,
  DEFAULT_DETECTOR_SETTINGS,
  DEFAULT_FFT_SETTINGS,
  type DetectorSettings,
  type FftSettings,
} from "@audiolab/core";
import type { ChordAcceptPolicy, NoteSource } from "@audiolab/core/games";

import {
  ChordGame,
  DetectorTab,
  LoupeRoot,
  FftTab,
  MicNotice,
  MicTransport,
  TabBar,
  ThemeToggle,
  WolfJumper,
  panelId,
  tabId,
  useMicrophone,
  usePitch,
  useTonality,
  type MicState,
  type TabDef,
} from "@audiolab/react";

import {
  VOCABULARIES,
  chordGamePools,
  minChordProbability,
  wolfBonusChords,
  type Vocabulary,
} from "./chordOptions";
import { About } from "./components/About";
import {
  ChordGameHow,
  ChordHow,
  KeyHow,
  SpectrumHow,
  TempoHow,
  WolfJumperHow,
} from "./how/explanations";
import { detectorHow } from "./how/detectorHow";
import { ChordOptions } from "./components/ChordOptions";
import { Brand } from "./components/Brand";
import { RhythmTab } from "./components/rhythm/RhythmTab";
import { ScalesTab } from "./components/ScalesTab";
import { TunerTab } from "./components/TunerTab";

type Group = "harmony-lab" | "rhythm-lab" | "game-room" | "about";
type Tab =
  "detector" | "scales" | "tuner" | "spectrum" | "rhythm" | "tempo" | "game" | "jumper" | "about";

/** Three rooms and the About page; each room holds a few pages. */
const GROUPS: ReadonlyArray<TabDef<Group>> = [
  { id: "harmony-lab", label: "Harmony Lab" },
  { id: "rhythm-lab", label: "Rhythm Lab" },
  { id: "game-room", label: "Game Room" },
  { id: "about", label: "About" },
];

const PAGES: Record<Group, ReadonlyArray<TabDef<Tab>>> = {
  "harmony-lab": [
    { id: "detector", label: "Chords & keys" },
    { id: "scales", label: "Scales" },
    { id: "tuner", label: "Tuner" },
    { id: "spectrum", label: "Spectrum" },
  ],
  "rhythm-lab": [
    { id: "rhythm", label: "Play along" },
    { id: "tempo", label: "Tempo" },
  ],
  "game-room": [
    { id: "game", label: "Chord game" },
    { id: "jumper", label: "Wolf Jumper" },
  ],
  about: [{ id: "about", label: "About" }],
};

const groupOf = (tab: Tab): Group =>
  (Object.keys(PAGES) as Group[]).find((g) => PAGES[g].some((p) => p.id === tab)) ?? "harmony-lab";

/** The page named in the URL hash (#jumper), so a page can be linked to. */
function tabFromHash(): Tab {
  const id = typeof location === "undefined" ? "" : location.hash.slice(1);
  return Object.values(PAGES).some((pages) => pages.some((p) => p.id === id))
    ? (id as Tab)
    : "detector";
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const group = groupOf(tab);
  // The last page opened in each room, so coming back lands where you left.
  const [lastPage, setLastPage] = useState<Record<Group, Tab>>({
    "harmony-lab": "detector",
    "rhythm-lab": "rhythm",
    "game-room": "game",
    about: "about",
  });
  const openPage = (next: Tab) => {
    setTab(next);
    setLastPage((last) => ({ ...last, [groupOf(next)]: next }));
  };
  useEffect(() => {
    history.replaceState(null, "", tab === "detector" ? location.pathname : `#${tab}`);
  }, [tab]);
  const [settings, setSettings] = useState<DetectorSettings>(DEFAULT_DETECTOR_SETTINGS);
  const [fftSettings, setFftSettings] = useState<FftSettings>(DEFAULT_FFT_SETTINGS);
  const [colourByPitch, setColourByPitch] = useState(false);
  const [vocabulary, setVocabulary] = useState<Vocabulary>("triads");
  const [accept, setAccept] = useState<ChordAcceptPolicy>("exact");
  const [noteSource, setNoteSource] = useState<NoteSource>("pitch");

  // Environment check (secure context, getUserMedia, AudioContext), after mount.
  const microphone = useMicrophone();
  const unsupported = microphone.unsupported;
  const tonality = useTonality(microphone.mic, {
    liveAcquisitionSeconds: settings.liveAcquisitionSeconds,
    tonalityAcquisitionSeconds: settings.tonalityAcquisitionSeconds,
    chordWindowSeconds: ANALYSIS_DEFAULTS.chordWindowSeconds,
    framesPerSecond: ANALYSIS_DEFAULTS.framesPerSecond,
    fftSize: ANALYSIS_DEFAULTS.fftSize,
    maxFilterTolerancy: settings.maxFilterTolerancy,
    maxFilterMemory: settings.maxFilterMemory,
    maxFilterMode: settings.maxFilterMode,
    fftEnabled: tab === "spectrum",
    noiseMethod: fftSettings.noiseMethod,
    chordQualities: VOCABULARIES[vocabulary].qualities,
  });
  // Only captured while Wolf Jumper reads its notes from the pitch tracker.
  const pitch = usePitch(microphone.mic, {
    enabled: tab === "jumper" && noteSource === "pitch",
  });

  let micState: MicState = "idle";
  if (unsupported) micState = "unsupported";
  else if (microphone.error) micState = "error";
  else if (microphone.running) micState = "live";
  else if (microphone.starting) micState = "starting";
  const micError = unsupported?.message ?? microphone.error;

  return (
    <LoupeRoot className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__brand">
            <Brand />
          </div>
          <nav className="topbar__tabs">
            <TabBar
              tabs={GROUPS}
              active={group}
              onSelect={(g) => openPage(lastPage[g])}
              label="Rooms"
            />
          </nav>
          <div className="topbar__transport">
            <MicTransport
              state={micState}
              onStart={microphone.start}
              onStop={microphone.stop}
              onReset={tonality.reset}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="main">
        <h1 className="al-visually-hidden">loloupTech — audio lab</h1>

        {micError && (
          <MicNotice
            message={micError}
            kind={unsupported ? "unsupported" : "error"}
            onRetry={microphone.start}
          />
        )}

        <section
          className="tabpanel"
          role="tabpanel"
          id={panelId(group)}
          aria-labelledby={tabId(group)}
          tabIndex={-1}
        >
          {PAGES[group].length > 1 && (
            <nav className="lab-subtabs">
              <TabBar tabs={PAGES[group]} active={tab} onSelect={openPage} label="Pages" />
            </nav>
          )}
          <div
            className="lab-page"
            {...(PAGES[group].length > 1 && {
              role: "tabpanel",
              id: panelId(tab),
              "aria-labelledby": tabId(tab),
            })}
          >
            {(tab === "detector" || tab === "game" || tab === "jumper") && (
              <ChordOptions
                vocabulary={vocabulary}
                onVocabularyChange={setVocabulary}
                accept={tab === "detector" ? undefined : accept}
                onAcceptChange={setAccept}
                noteSource={tab === "jumper" ? noteSource : undefined}
                onNoteSourceChange={setNoteSource}
              />
            )}

            {tab === "detector" && (
              <>
                <DetectorTab
                  data={tonality}
                  settings={settings}
                  onSettingsChange={setSettings}
                  colourByPitch={colourByPitch}
                  onColourByPitchChange={setColourByPitch}
                  how={detectorHow({
                    live: settings.liveAcquisitionSeconds,
                    long: settings.tonalityAcquisitionSeconds,
                    extended: vocabulary !== "triads",
                  })}
                />
                <div className="lab-how">
                  <KeyHow />
                  <ChordHow />
                </div>
              </>
            )}

            {tab === "tuner" && (
              <TunerTab
                mic={microphone.mic}
                running={microphone.running}
                onStart={microphone.start}
              />
            )}

            {tab === "scales" && (
              <ScalesTab
                presence={tonality.presenceHistogram}
                windowSeconds={settings.tonalityAcquisitionSeconds}
                running={microphone.running}
                onStart={microphone.start}
                colourByPitch={colourByPitch}
              />
            )}

            {tab === "game" && (
              <>
                <ChordGame
                  chords={tonality.chords}
                  running={microphone.running}
                  onStart={microphone.start}
                  pools={chordGamePools(vocabulary)}
                  accept={accept}
                  minProbability={minChordProbability(vocabulary)}
                />
                <div className="lab-how">
                  <ChordGameHow />
                </div>
              </>
            )}

            {tab === "jumper" && (
              <>
                <WolfJumper
                  // The bonus chords are read at mount: a new vocabulary starts a new game.
                  key={vocabulary}
                  config={{ bonusChords: wolfBonusChords(vocabulary) }}
                  detection={{
                    noteSource,
                    chordAccept: accept,
                    minChordProbability: minChordProbability(vocabulary),
                  }}
                  pitch={pitch.estimate}
                  instantaneousChroma={tonality.instantaneousChroma}
                  chords={tonality.chords}
                  running={microphone.running}
                  signalLevelDb={tonality.signalLevelDb}
                  onStart={microphone.start}
                />
                <div className="lab-how">
                  <WolfJumperHow />
                </div>
              </>
            )}

            {tab === "rhythm" && (
              <RhythmTab
                mic={microphone.mic}
                running={microphone.running}
                onStart={microphone.start}
              />
            )}

            {(tab === "spectrum" || tab === "tempo") && (
              <>
                <FftTab
                  mic={microphone.mic}
                  spectrum={tonality.fft}
                  settings={fftSettings}
                  onSettingsChange={setFftSettings}
                  view={tab}
                />
                <div className="lab-how">{tab === "spectrum" ? <SpectrumHow /> : <TempoHow />}</div>
              </>
            )}

            {tab === "about" && <About />}
          </div>
        </section>
      </main>
    </LoupeRoot>
  );
}
