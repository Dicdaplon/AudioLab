/**
 * @audiolab/react — public API.
 *
 * Hooks, presentational components, canvas plots and games on top of
 * @audiolab/core, styled by the Loupe design system (`./styles.css`). Every
 * module here is a client module. Modules that are not re-exported from
 * this file (canvas helpers, stores) are internal; the game engines live in
 * `@audiolab/core/games`. Prop types
 * of a component are available through `React.ComponentProps<typeof X>`.
 */

export { BUILD_INFO, type BuildInfo } from "./buildInfo";

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
  useConfirmedDetection,
  type UseConfirmedDetectionArgs,
  type UseConfirmedDetectionResult,
} from "./games/useConfirmedDetection";
// The pure confirmation step lives in @audiolab/core/games; re-exported for convenience.
export {
  stepConfirmation,
  type ConfirmationOptions,
  type ConfirmationState,
  type ConfirmationStep,
} from "@audiolab/core/games";

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

export {
  ChordGame,
  DEFAULT_CHORD_GAME_POOLS,
  type ChordGamePool,
} from "./games/chord-game/ChordGame";
export { CHORD_POOL_LABELS_EN } from "./games/chord-game/labels";
export { WolfJumper } from "./games/wolf-jumper/WolfJumper";
export { bonusTypeLabels, type BonusTypeLabels } from "./games/wolf-jumper/constants";
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
