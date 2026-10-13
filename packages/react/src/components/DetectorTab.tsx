"use client";

import {
  ANALYSIS_DEFAULTS,
  type ChordScore,
  type DetectorSettings,
  type KeyScore,
} from "@audiolab/core";
import { splitKeyName } from "../ui/rankRows";
import { ChordView } from "./ChordView";
import { ChromaView } from "./ChromaView";
import { KeyProbabilities } from "./KeyProbabilities";
import { Readout } from "./Readout";
import { SettingsPanel } from "./SettingsPanel";
import { SettingsRail } from "./SettingsRail";
import { ToneBaseTonalityView } from "./ToneBaseTonalityView";

export interface DetectorData {
  instantaneousChroma: Float32Array;
  chordChroma: Float32Array;
  liveAcquisitionChroma: Float32Array;
  tonalityAcquisitionChroma: Float32Array;
  chords: ChordScore[];
  liveKeys: KeyScore[];
  tonalityKeys: KeyScore[];
  presenceHistogram: Float32Array;
  filteredLiveChroma: Float32Array;
  presenceIndicator: Float32Array;
  presenceKeys: KeyScore[];
  filterThreshold: number;
  filterLastPeak: number;
}

interface DetectorTabProps {
  data: DetectorData;
  settings: DetectorSettings;
  onSettingsChange: (settings: DetectorSettings) => void;
  colourByPitch: boolean;
  onColourByPitchChange: (value: boolean) => void;
}

function KeyReadout({ label, meta, keys }: { label: string; meta: string; keys: KeyScore[] }) {
  const top = keys[0];
  const name = top ? splitKeyName(top.name) : null;
  return (
    <Readout
      label={label}
      meta={meta}
      value={name?.tonic ?? null}
      qualifier={name?.mode}
      mode={top?.mode}
      probability={top?.probability}
    />
  );
}

/** The detector bench: hero readouts, chroma windows, ranked lists, presence. */
export function DetectorTab({
  data,
  settings,
  onSettingsChange,
  colourByPitch,
  onColourByPitchChange,
}: DetectorTabProps) {
  const chordWindow = ANALYSIS_DEFAULTS.chordWindowSeconds;
  const live = settings.liveAcquisitionSeconds;
  const long = settings.tonalityAcquisitionSeconds;
  const topChord = data.chords[0];

  return (
    <div className="al-detector">
      <div className="al-detector__hero">
        <Readout
          compact
          label="Chord"
          meta={`${chordWindow} s`}
          value={topChord?.name ?? null}
          mode={topChord?.quality}
          probability={topChord?.probability}
        />
        <KeyReadout label="Live key" meta={`${live} s`} keys={data.liveKeys} />
        <KeyReadout label="Estimated key" meta={`${long} s`} keys={data.tonalityKeys} />
      </div>

      <div className="al-detector__settings">
        <SettingsRail>
          <SettingsPanel
            settings={settings}
            onChange={onSettingsChange}
            currentThreshold={data.filterThreshold}
            lastPeak={data.filterLastPeak}
            colourByPitch={colourByPitch}
            onColourByPitchChange={onColourByPitchChange}
          />
        </SettingsRail>
      </div>

      <div className="al-detector__chroma">
        <ChromaView
          title="Instantaneous chroma"
          chroma={data.instantaneousChroma}
          colourByPitch={colourByPitch}
        />
        <ChromaView
          title="Chord window"
          meta={`${chordWindow} s`}
          chroma={data.chordChroma}
          colourByPitch={colourByPitch}
        />
        <ChromaView
          title="Live window"
          meta={`${live} s`}
          chroma={data.liveAcquisitionChroma}
          colourByPitch={colourByPitch}
        />
        <ChromaView
          title="Tonality window"
          meta={`${long} s`}
          chroma={data.tonalityAcquisitionChroma}
          colourByPitch={colourByPitch}
        />
      </div>

      <div className="al-detector__lists">
        <ChordView chords={data.chords} windowSeconds={chordWindow} topN={6} />
        <KeyProbabilities
          title="Live key candidates"
          keys={data.liveKeys}
          windowSeconds={live}
          topN={5}
        />
        <KeyProbabilities
          title="Key candidates"
          keys={data.tonalityKeys}
          windowSeconds={long}
          topN={5}
        />
      </div>

      <ToneBaseTonalityView
        className="al-detector__tone"
        presence={data.presenceHistogram}
        filteredLiveChroma={data.filteredLiveChroma}
        presenceIndicator={data.presenceIndicator}
        keys={data.presenceKeys}
        liveSeconds={live}
        tonalitySeconds={long}
        topN={6}
        colourByPitch={colourByPitch}
      />
    </div>
  );
}
