/**
 * @audiolab/react/stage: live visuals for a stream or a stage screen. They
 * render on a transparent page (an OBS browser source), outside the Loupe
 * root, with their own literal theme, fixed pixel sizes and
 * requestAnimationFrame loops that never re-render React.
 *
 * - `useStageSignals` gathers key, chords, note, tempo, attacks and display
 *   taps from one or two sessions;
 * - plates (`KeyPlate`, `ChordPlate`, `TunerPlate`, `ChordRibbon`) show the
 *   readings as text;
 * - visuals draw on `StageCanvas`, in pixel-art cells that survive stream
 *   compression.
 */

export {
  useStageSignals,
  type StageOnset,
  type StageSignals,
  type StageState,
  type UseStageSignalsOptions,
} from "./stage/useStageSignals";
export {
  StageCanvas,
  type StageCanvasProps,
  type StageDraw,
  type StageFrame,
} from "./stage/StageCanvas";
export {
  useStoredStageSettings,
  type StoredStageSettings,
  type UseStoredStageSettingsOptions,
} from "./stage/useStoredStageSettings";
export { STAGE_THEME, modeColour, withAlpha, type StageTheme } from "./stage/theme";
export {
  bendLabel,
  chordName,
  chordSuffix,
  isMinorQuality,
  keyShortName,
  modeName,
  noteName,
  type Notation,
} from "./stage/names";
export { Plate, type PlateProps } from "./stage/plates/Plate";
export { KeyPlate, type KeyPlateProps } from "./stage/plates/KeyPlate";
export { ChordPlate, type ChordPlateProps } from "./stage/plates/ChordPlate";
export { TunerPlate, type TunerPlateProps } from "./stage/plates/TunerPlate";
export { ChordRibbon, type ChordRibbonProps } from "./stage/plates/ChordRibbon";
export {
  StageSettingsPanel,
  type StageSettingsPanelProps,
} from "./stage/plates/StageSettingsPanel";
export { FifthsMandala, type FifthsMandalaProps } from "./stage/visuals/FifthsMandala";
export { NoteConstellation, type NoteConstellationProps } from "./stage/visuals/NoteConstellation";
export { FifthsSky, type FifthsSkyProps } from "./stage/visuals/FifthsSky";
export { HarmonyWell, type HarmonyWellProps } from "./stage/visuals/HarmonyWell";
export { SpectrumCity, type Roofline, type SpectrumCityProps } from "./stage/visuals/SpectrumCity";
export { PawTrail, type PawTrailProps } from "./stage/visuals/PawTrail";
export {
  Oscilloscope,
  type OscilloscopeMode,
  type OscilloscopeProps,
} from "./stage/visuals/Oscilloscope";
export { HarmonicAurora, type HarmonicAuroraProps } from "./stage/visuals/HarmonicAurora";
export { BeatRings, type BeatRingsProps } from "./stage/visuals/BeatRings";
export {
  ChordShockwave,
  type ChordShockwaveProps,
  type ShockwaveClip,
} from "./stage/visuals/ChordShockwave";
export { ChordTunnel, type ChordTunnelProps } from "./stage/visuals/ChordTunnel";
export { NoteLane, type NoteLaneProps } from "./stage/visuals/NoteLane";
export { AttackField, type AttackFieldProps } from "./stage/visuals/AttackField";
export { GuitarTimeline, type GuitarTimelineProps } from "./stage/visuals/GuitarTimeline";
export {
  StageBackdrop,
  type BackdropRect,
  type StageBackdropProps,
} from "./stage/visuals/StageBackdrop";
export {
  LEVEL_CAPSULE_SIZE,
  LevelCapsule,
  type LevelCapsuleProps,
} from "./stage/visuals/LevelCapsule";
