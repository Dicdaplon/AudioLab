import { useState } from "react";
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
import { ChordOptions } from "./components/ChordOptions";
import { Brand } from "./components/Brand";
import { RhythmTab } from "./components/rhythm/RhythmTab";
import { ScalesTab } from "./components/ScalesTab";
import { TunerTab } from "./components/TunerTab";

type Tab = "detector" | "tuner" | "scales" | "game" | "jumper" | "rhythm" | "fft" | "about";

const TABS: ReadonlyArray<TabDef<Tab>> = [
  { id: "detector", label: "Detector" },
  { id: "tuner", label: "Tuner" },
  { id: "scales", label: "Scales" },
  { id: "game", label: "Chord game" },
  { id: "jumper", label: "Wolf Jumper" },
  { id: "rhythm", label: "Rhythm" },
  { id: "fft", label: "FFT" },
  { id: "about", label: "About" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("detector");
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
    fftEnabled: tab === "fft",
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
            <TabBar tabs={TABS} active={tab} onSelect={setTab} label="Sections" />
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
        <h1 className="al-visually-hidden">loup(e) — audio lab</h1>

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
          id={panelId(tab)}
          aria-labelledby={tabId(tab)}
          tabIndex={-1}
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

          {tab === "fft" && (
            <>
              <FftTab
                mic={microphone.mic}
                spectrum={tonality.fft}
                settings={fftSettings}
                onSettingsChange={setFftSettings}
              />
              <div className="lab-how">
                <SpectrumHow />
                <TempoHow />
              </div>
            </>
          )}

          {tab === "about" && <About />}
        </section>
      </main>
    </LoupeRoot>
  );
}
