import type { ReactNode } from "react";
import type { DetectorSettings } from "@audiolab/core";
import {
  ChordView,
  ChromaView,
  KeyProbabilities,
  Readout,
  SettingsPanel,
  ToneBaseTonalityView,
  qualityMode,
  splitKeyName,
  type DetectorData,
} from "@audiolab/react";

import type { ChordsKeysHow } from "../how/detectorHow";

const PITCHES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** The key sharing every note: C major ↔ A minor. */
function relativeKey(tonic: string, mode: string): string | null {
  const i = PITCHES.indexOf(tonic);
  if (i < 0) return null;
  if (mode === "major") return `${PITCHES[(i + 9) % 12]} minor`;
  if (mode === "minor") return `${PITCHES[(i + 3) % 12]} major`;
  return null;
}

interface ChordsKeysPageProps {
  data: DetectorData;
  settings: DetectorSettings;
  onSettingsChange: (settings: DetectorSettings) => void;
  colourByPitch: boolean;
  onColourByPitchChange: (value: boolean) => void;
  /** The method pickers, shown between the answers and the machinery. */
  methods: ReactNode;
  how: ChordsKeysHow;
}

/**
 * Chords & keys, for a player: the chord, one key, the notes heard and the
 * chord candidates; the methods to pick; the windows, the raw key lists,
 * presence and the fine settings folded under "Under the hood".
 */
export function ChordsKeysPage({
  data,
  settings,
  onSettingsChange,
  colourByPitch,
  onColourByPitchChange,
  methods,
  how,
}: ChordsKeysPageProps) {
  const chord = data.chords[0];
  const key = data.tonalityKeys[0];
  const keyName = key ? splitKeyName(key.name) : null;
  const relative = keyName && relativeKey(keyName.tonic, keyName.mode);
  const live = settings.liveAcquisitionSeconds;
  const long = settings.tonalityAcquisitionSeconds;

  return (
    <div className="lab-ck">
      <div className="lab-ck__answers">
        <Readout
          label="Chord"
          value={chord?.name ?? null}
          mode={chord && qualityMode(chord.quality)}
          probability={chord?.probability}
        />
        <div className="lab-ck__key">
          <Readout
            label="Key"
            value={keyName?.tonic ?? null}
            qualifier={keyName?.mode}
            mode={key?.mode}
            probability={key?.probability}
          />
          {relative && <p className="al-hint lab-ck__relative">or {relative}, same notes</p>}
        </div>
        <div className="lab-ck__how">{how.page}</div>
      </div>

      <div className="lab-ck__now">
        <ChromaView
          title="Notes I hear"
          chroma={data.chordChroma}
          colourByPitch={colourByPitch}
          how={how.notes}
        />
        <ChordView chords={data.chords} topN={5} how={how.chords} />
      </div>

      {methods}

      <details className="lab-hood">
        <summary className="lab-hood__summary">
          <span className="lab-hood__title">Under the hood</span>
          <span className="al-hint">the windows, every key candidate, presence, fine settings</span>
        </summary>
        <div className="lab-hood__body">
          {how.readouts}
          <SettingsPanel
            settings={settings}
            onChange={onSettingsChange}
            currentThreshold={data.filterThreshold}
            lastPeak={data.filterLastPeak}
            colourByPitch={colourByPitch}
            onColourByPitchChange={onColourByPitchChange}
            how={how.settings}
          />
          <div className="al-detector__chroma">
            <ChromaView
              title="Instantaneous chroma"
              chroma={data.instantaneousChroma}
              colourByPitch={colourByPitch}
              how={how.instantChroma}
            />
            <ChromaView
              title="Chord window"
              meta="1 s"
              chroma={data.chordChroma}
              colourByPitch={colourByPitch}
              how={how.chordChroma}
            />
            <ChromaView
              title="Live window"
              meta={`${live} s`}
              chroma={data.liveAcquisitionChroma}
              colourByPitch={colourByPitch}
              how={how.liveChroma}
            />
            <ChromaView
              title="Tonality window"
              meta={`${long} s`}
              chroma={data.tonalityAcquisitionChroma}
              colourByPitch={colourByPitch}
              how={how.tonalityChroma}
            />
          </div>
          <div className="lab-hood__keys">
            <KeyProbabilities
              title="Live key candidates"
              keys={data.liveKeys}
              windowSeconds={live}
              topN={5}
              how={how.liveKeys}
            />
            <KeyProbabilities
              title="Key candidates"
              keys={data.tonalityKeys}
              windowSeconds={long}
              topN={5}
              how={how.keys}
            />
          </div>
          <ToneBaseTonalityView
            presence={data.presenceHistogram}
            filteredLiveChroma={data.filteredLiveChroma}
            presenceIndicator={data.presenceIndicator}
            keys={data.presenceKeys}
            liveSeconds={live}
            tonalitySeconds={long}
            topN={6}
            colourByPitch={colourByPitch}
            how={how.presence}
          />
        </div>
      </details>
    </div>
  );
}
