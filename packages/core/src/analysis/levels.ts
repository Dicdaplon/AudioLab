/** Level reported for an all-zero block by the block level meters, in dBFS. */
export const ENVELOPE_FLOOR_DB = -120;

/** RMS of a block in dBFS, floored at `ENVELOPE_FLOOR_DB`. */
export function rmsToDb(rms: number): number {
  return rms > 0 ? Math.max(ENVELOPE_FLOOR_DB, 20 * Math.log10(rms)) : ENVELOPE_FLOOR_DB;
}
