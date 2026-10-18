/** Verdicts of a run, laid onto the events of its score (rests skipped). */

import type { NoteResult, RhythmEvent } from "@audiolab/core/rhythm";
import { targetState, type LaneTargetState } from "@audiolab/react";

export function staffStates(
  events: readonly RhythmEvent[],
  results: readonly NoteResult[] | null,
): (LaneTargetState | undefined)[] {
  let k = 0;
  return events.map((e) => {
    if (e.rest) return undefined;
    const r = results?.[k++];
    return r ? targetState(r) : undefined;
  });
}
