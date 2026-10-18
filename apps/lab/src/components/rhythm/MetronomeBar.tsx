import type { BeatGrid } from "@audiolab/core";
import { BeatLights, SelectField, Switch } from "@audiolab/react";

import { TEMPI } from "./exercises";

interface MetronomeBarProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  sound: boolean;
  onSoundChange: (on: boolean) => void;
  grid: Readonly<BeatGrid> | null;
  now: () => number | null;
}

/** Tempo, click sound, and the beat lights (count-in included). */
export function MetronomeBar({
  bpm,
  onBpmChange,
  sound,
  onSoundChange,
  grid,
  now,
}: MetronomeBarProps) {
  return (
    <div className="rhythm__metronome">
      <SelectField
        id="rhythm-tempo"
        label="Tempo"
        value={String(bpm)}
        onChange={(v) => onBpmChange(Number(v))}
      >
        {TEMPI.map((t) => (
          <option key={t} value={t}>
            {t} BPM
          </option>
        ))}
      </SelectField>
      <Switch id="rhythm-click" checked={sound} onChange={onSoundChange}>
        Click sound
      </Switch>
      <BeatLights grid={grid} now={now} />
    </div>
  );
}
