import { useEffect, useState } from "react";
import {
  ANALYSIS_DEFAULTS,
  DEFAULT_DETECTOR_SETTINGS,
  DEFAULT_FFT_SETTINGS,
  type DetectorSettings,
  type FftSettings,
  type KeyProfileName,
} from "@audiolab/core";
import type { ChordAcceptPolicy, NoteSource } from "@audiolab/core/games";

import {
  ChordGame,
  LoupeRoot,
  FftTab,
  MicNotice,
  MicTransport,
  TabBar,
  SelectField,
  ThemeToggle,
  WolfJumper,
  panelId,
  tabId,
  useMicrophone,
  useNoteModelChords,
  usePitch,
  useTonality,
  type MicState,
  type TabDef,
} from "@audiolab/react";

import {
  KEY_REFERENCES,
  VOCABULARIES,
  chordGamePools,
  minChordProbability,
  wolfBonusChords,
  type Vocabulary,
} from "./chordOptions";
import { MethodPicker } from "./components/MethodPicker";
import { useBasicPitchRunner } from "./ml/useBasicPitchRunner";
import {
  CHORD_ENGINE,
  CHORD_METHODS,
  KEY_METHODS,
  TEMPO_METHODS,
  type ChordMethodId,
  type KeyMethodId,
  type TempoMethodId,
} from "./methods";
import { About } from "./components/About";
import { ChordGameHow, SpectrumHow, TempoHow, WolfJumperHow } from "./how/explanations";
import { detectorHow } from "./how/detectorHow";
import { ChordOptions } from "./components/ChordOptions";
import { ChordsKeysPage } from "./components/ChordsKeysPage";
import { CrtOverlay, CrtToggle } from "./components/CrtOverlay";
import { useCrt } from "./crt";
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
  // Flips on every page change so the CSS entry animation replays without
  // remounting the page (crt.css, .lab-page[data-enter]).
  const [enter, setEnter] = useState<"a" | "b">("a");
  const [crt, setCrt] = useCrt();
  const openPage = (next: Tab) => {
    if (next !== tab) setEnter((e) => (e === "a" ? "b" : "a"));
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
  const [chordMethod, setChordMethod] = useState<ChordMethodId>("classic");
  const [keyMethod, setKeyMethod] = useState<KeyMethodId>("chords");
  const [keyProfile, setKeyProfile] = useState<KeyProfileName>("krumhansl");
  const [tempoMethod, setTempoMethod] = useState<TempoMethodId>("envelope");

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
    ...CHORD_ENGINE[chordMethod],
    keyMethod,
    keyProfile,
  });
  // The AI chord method: Basic Pitch, loaded only when picked on a chord page.
  const aiChords =
    chordMethod === "ai" && (tab === "detector" || tab === "game" || tab === "jumper");
  const basicPitch = useBasicPitchRunner(aiChords);
  const noteChords = useNoteModelChords(microphone.mic, {
    runner: basicPitch.runner,
    enabled: aiChords,
  });
  const chords = aiChords ? (noteChords.chord ? noteChords.chords : []) : tonality.chords;
  const chordData = aiChords ? { ...tonality, chords } : tonality;
  let aiNote: string | undefined;
  if (aiChords) {
    if (basicPitch.error || noteChords.error) {
      aiNote = `The AI model could not start (${(basicPitch.error ?? noteChords.error)!.message}).`;
    } else if (basicPitch.loading) aiNote = "Loading the AI model (about 15 MB, once)…";
    else if (!microphone.running) aiNote = "The AI model is ready: start the microphone.";
    else if (noteChords.inferenceMs !== null) {
      aiNote = `AI listening: one look every 0.25 s, each in ${Math.round(noteChords.inferenceMs)} ms.`;
    } else aiNote = "AI listening…";
  }

  // Only captured while Wolf Jumper reads its notes from the pitch tracker.
  const pitch = usePitch(microphone.mic, {
    enabled: tab === "jumper" && noteSource === "pitch",
  });

  const chordPicker = (
    <MethodPicker
      name="chord-method"
      title="Chord detection method"
      choices={CHORD_METHODS}
      value={chordMethod}
      onChange={setChordMethod}
      note={
        tab === "detector" || aiNote ? (
          <>
            {tab === "detector" && (
              <SelectField
                id="chord-vocabulary"
                label="Chords it knows"
                value={vocabulary}
                onChange={(v) => setVocabulary(v as Vocabulary)}
              >
                {(Object.keys(VOCABULARIES) as Vocabulary[]).map((id) => (
                  <option key={id} value={id}>
                    {VOCABULARIES[id].label}
                  </option>
                ))}
              </SelectField>
            )}
            {tab === "detector" && <p>{VOCABULARIES[vocabulary].hint}</p>}
            {aiNote && <p>{aiNote}</p>}
          </>
        ) : undefined
      }
    />
  );
  const keyPicker = (
    <MethodPicker
      name="key-method"
      title="Key detection method"
      choices={KEY_METHODS}
      value={keyMethod}
      onChange={setKeyMethod}
      note={
        keyMethod === "profile" ? (
          <SelectField
            id="key-reference"
            label="What a key sounds like, after"
            value={keyProfile}
            onChange={(v) => setKeyProfile(v as KeyProfileName)}
          >
            {(Object.keys(KEY_REFERENCES) as KeyProfileName[]).map((id) => (
              <option key={id} value={id}>
                {KEY_REFERENCES[id]}
              </option>
            ))}
          </SelectField>
        ) : undefined
      }
    />
  );

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
            <CrtToggle on={crt} onChange={setCrt} />
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
            data-enter={enter}
            {...(PAGES[group].length > 1 && {
              role: "tabpanel",
              id: panelId(tab),
              "aria-labelledby": tabId(tab),
            })}
          >
            {(tab === "game" || tab === "jumper") && (
              <>
                <ChordOptions
                  vocabulary={vocabulary}
                  onVocabularyChange={setVocabulary}
                  accept={accept}
                  onAcceptChange={setAccept}
                  noteSource={tab === "jumper" ? noteSource : undefined}
                  onNoteSourceChange={setNoteSource}
                />
                <div className="lab-methods">{chordPicker}</div>
              </>
            )}

            {tab === "detector" && (
              <ChordsKeysPage
                data={chordData}
                settings={settings}
                onSettingsChange={setSettings}
                colourByPitch={colourByPitch}
                onColourByPitchChange={setColourByPitch}
                methods={
                  <div className="lab-methods lab-methods--pair">
                    {chordPicker}
                    {keyPicker}
                  </div>
                }
                how={detectorHow({
                  live: settings.liveAcquisitionSeconds,
                  long: settings.tonalityAcquisitionSeconds,
                  extended: vocabulary !== "triads",
                  keyFromChords: keyMethod === "chords",
                })}
              />
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
                  chords={chords}
                  running={microphone.running}
                  onStart={microphone.start}
                  pools={chordGamePools(vocabulary)}
                  accept={accept}
                  minProbability={minChordProbability(vocabulary)}
                  signalLevelDb={tonality.signalLevelDb}
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
                  chords={chords}
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

            {tab === "tempo" && (
              <MethodPicker
                name="tempo-method"
                title="Tempo method"
                choices={TEMPO_METHODS}
                value={tempoMethod}
                onChange={setTempoMethod}
              />
            )}

            {(tab === "spectrum" || tab === "tempo") && (
              <>
                <FftTab
                  tempoMethod={tempoMethod}
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
      <CrtOverlay on={crt} />
    </LoupeRoot>
  );
}
