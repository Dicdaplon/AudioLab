/** The stream's mascot: a pixel wolf that reacts to the music (see `WolfBuddy`). */

export { WolfBuddy, type WolfBuddyProps } from "./WolfBuddy";
export {
  WOLF_BRAIN_DEFAULTS,
  WOLF_POSE_SECONDS,
  WolfBrain,
  type WolfBrainOptions,
  type WolfMood,
  type WolfPhrase,
  type WolfPose,
  type WolfSnapshot,
} from "./brain";
export {
  WOLF_PHRASE_PRIORITY,
  WOLF_PHRASES,
  type WolfPhraseKind,
  type WolfPhrases,
} from "./phrases";
export {
  WOLF_ROAM_DEFAULTS,
  bandBalance,
  chooseDestination,
  chooseHide,
  createRoam,
  hideX,
  hideY,
  shouldFall,
  standY,
  stepRoam,
  type HideEnd,
  type RoamMode,
  type RoamMusic,
  type RoamOptions,
  type RoamState,
  type RoamWorld,
} from "./roam";
export { WolfSensor, wolfKeyName } from "./sensor";
