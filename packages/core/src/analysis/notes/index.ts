/**
 * Note models ("AI listening"): the model-independent half of Basic Pitch
 * (resampling, windowing, stitching) and chords read from its notes. The
 * network itself runs behind `NoteModelRunner`, supplied by the app.
 */
export {
  BASIC_PITCH,
  BASIC_PITCH_FPS,
  BASIC_PITCH_LOOKAHEAD_SECONDS,
  checkNoteModelOutput,
  transcribeNotes,
  type NoteActivations,
  type NoteModelOutput,
  type NoteModelRunner,
} from "./basicPitch";
export {
  NoteChordDecoder,
  NoteModelChords,
  noteChroma,
  type NoteChordDecision,
  type NoteChordOptions,
  type NoteChordResult,
  type NoteChroma,
  type NoteModelWindow,
} from "./noteChords";
export { resampleAudio, StreamResampler } from "./resample";
