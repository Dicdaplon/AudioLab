"use client";

import type { ReactNode } from "react";
import {
  ANALYSIS_DEFAULTS,
  type ChordScore,
  type DetectorSettings,
  type KeyScore,
} from "@audiolab/core";
import { qualityMode, splitKeyName } from "../ui/rankRows";
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

/**
 * Compact "How?" sheets for the detector's windows, one slot per panel.
 * The words belong to the host (see the lab's explanations); a panel with a
 * sheet drops its technical hint.
 */
export interface DetectorHow {
  /** Under the three readouts: why three answers. */
  readouts?: ReactNode;
  instantChroma?: ReactNode;
  chordChroma?: ReactNode;
  liveChroma?: ReactNode;
  tonalityChroma?: ReactNode;
  chords?: ReactNode;
  liveKeys?: ReactNode;
  keys?: ReactNode;
  presence?: ReactNode;
  settings?: ReactNode;
}

interface DetectorTabProps {
  data: DetectorData;
  settings: DetectorSettings;
  onSettingsChange: (settings: DetectorSettings) => void;
  colourByPitch: boolean;
  onColourByPitchChange: (value: boolean) => void;
  how?: DetectorHow;
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
  how = {},
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
          mode={topChord && qualityMode(topChord.quality)}
          probability={topChord?.probability}
        />
        <KeyReadout label="Live key" meta={`${live} s`} keys={data.liveKeys} />
        <KeyReadout label="Estimated key" meta={`${long} s`} keys={data.tonalityKeys} />
        {how.readouts && <div className="al-detector__hero-how">{how.readouts}</div>}
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
            how={how.settings}
          />
        </SettingsRail>
      </div>

      <div className="al-detector__chroma">
        <ChromaView
          title="Instantaneous chroma"
          chroma={data.instantaneousChroma}
          colourByPitch={colourByPitch}
          how={how.instantChroma}
        />
        <ChromaView
          title="Chord window"
          meta={`${chordWindow} s`}
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

      <div className="al-detector__lists">
        <ChordView chords={data.chords} windowSeconds={chordWindow} topN={6} how={how.chords} />
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
        className="al-detector__tone"
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
  );
}
