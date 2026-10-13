/**
 * @audiolab/react — public API.
 *
 * Hooks, presentational components, canvas plots and games on top of
 * @audiolab/core, styled by the Loupe design system (`./styles.css`). Every
 * module here is a client module. Modules that are not re-exported from
 * this file (canvas helpers, game engines, stores) are internal. Prop types
 * of a component are available through `React.ComponentProps<typeof X>`.
 */

// --- Root -------------------------------------------------------------------

export { LOUPE_ROOT_CLASS, LoupeRoot, useLoupeRoot, type LoupeRootProps } from "./LoupeRoot";

// --- Hooks ------------------------------------------------------------------

export {
  useMicrophone,
  type MicrophoneSession,
  type UseMicrophoneOptions,
} from "./hooks/useMicrophone";
export { useTonality, type SpectrumState, type UseTonalityOptions } from "./hooks/useTonality";
export {
  useTempoAnalysis,
  type TempoAnalysisState,
  type UseTempoAnalysisOptions,
} from "./hooks/useTempoAnalysis";
export { usePitch, type PitchState, type UsePitchOptions } from "./hooks/usePitch";
export {
  stepConfirmation,
  useConfirmedDetection,
  type ConfirmationOptions,
  type ConfirmationState,
  type ConfirmationStep,
  type UseConfirmedDetectionArgs,
  type UseConfirmedDetectionResult,
} from "./games/useConfirmedDetection";

// --- Readouts and detector views -------------------------------------------

export { Panel } from "./components/Panel";
export { Readout, type Mode } from "./components/Readout";
export { RankList, type RankRow } from "./components/RankList";
export { Segments } from "./components/Segments";
export { ChromaBars } from "./components/ChromaBars";
export { ChromaView } from "./components/ChromaView";
export { ChordView } from "./components/ChordView";
export { KeyProbabilities } from "./components/KeyProbabilities";
export { ToneBaseTonalityView } from "./components/ToneBaseTonalityView";
export { DetectorTab, type DetectorData } from "./components/DetectorTab";
export { SettingsPanel } from "./components/SettingsPanel";
export { FftSettingsPanel } from "./components/FftSettingsPanel";
export { SettingsRail } from "./components/SettingsRail";
export { FftTab } from "./components/FftTab";

// --- Plots ------------------------------------------------------------------

export { PlotFigure, type LegendItem } from "./components/Plot";
export { SpectrumPlot } from "./components/SpectrumPlot";
export { TempoPlot } from "./components/TempoPlot";
export { TimeSignalPlot } from "./components/TimeSignalPlot";

// --- Controls and chrome ----------------------------------------------------

export { RangeField, SelectField, Switch } from "./components/Field";
export { Icon, type IconName } from "./ui/Icon";
export { MicNotice } from "./components/MicNotice";
export { MicTransport, type MicState } from "./components/MicTransport";
export { TabBar, type TabDef } from "./components/TabBar";
export { ThemeToggle } from "./components/ThemeToggle";
export { panelId, tabId } from "./ui/tabIds";

// --- Games ------------------------------------------------------------------

export { ChordGame } from "./games/chord-game/ChordGame";
export { WolfJumper } from "./games/wolf-jumper/WolfJumper";
export { MicPrompt } from "./games/MicPrompt";

// --- Theme ------------------------------------------------------------------

export {
  THEME_STORAGE_KEY,
  applyTheme,
  isTheme,
  readStoredTheme,
  resolveTheme,
  systemTheme,
  type Theme,
} from "./ui/theme";
export { DEFAULT_VIZ_THEME, readVizTheme, useVizTheme, type VizTheme } from "./ui/vizTheme";
export { BREAKPOINTS, useMediaQuery } from "./ui/useMediaQuery";
export { chordRows, keyRows, splitKeyName } from "./ui/rankRows";
