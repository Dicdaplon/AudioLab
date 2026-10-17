import type { ChordAcceptPolicy, NoteSource } from "@audiolab/core/games";
import { Panel, SelectField } from "@audiolab/react";

import { VOCABULARIES, type Vocabulary } from "../chordOptions";

interface ChordOptionsProps {
  vocabulary: Vocabulary;
  onVocabularyChange: (v: Vocabulary) => void;
  /** Shown in the games only. */
  accept?: ChordAcceptPolicy;
  onAcceptChange?: (a: ChordAcceptPolicy) => void;
  /** Shown in Wolf Jumper only. */
  noteSource?: NoteSource;
  onNoteSourceChange?: (s: NoteSource) => void;
}

/** Detection options shared by the detector and the games. */
export function ChordOptions({
  vocabulary,
  onVocabularyChange,
  accept,
  onAcceptChange,
  noteSource,
  onNoteSourceChange,
}: ChordOptionsProps) {
  return (
    <Panel className="lab-options">
      <SelectField
        id="chord-vocabulary"
        label="Chord vocabulary"
        value={vocabulary}
        onChange={(v) => onVocabularyChange(v as Vocabulary)}
      >
        {(Object.keys(VOCABULARIES) as Vocabulary[]).map((id) => (
          <option key={id} value={id}>
            {VOCABULARIES[id].label}
          </option>
        ))}
      </SelectField>

      {accept !== undefined && onAcceptChange && (
        <SelectField
          id="chord-accept"
          label="A chord counts when"
          value={accept}
          onChange={(v) => onAcceptChange(v as ChordAcceptPolicy)}
        >
          <option value="exact">it has the same notes</option>
          <option value="triad">its triad matches (E for E7)</option>
        </SelectField>
      )}

      {noteSource !== undefined && onNoteSourceChange && (
        <SelectField
          id="note-source"
          label="Note detection"
          value={noteSource}
          onChange={(v) => onNoteSourceChange(v as NoteSource)}
        >
          <option value="chroma">strongest chroma bin</option>
          <option value="pitch">pitch tracker (MPM)</option>
        </SelectField>
      )}
    </Panel>
  );
}
