import type { ChordScore } from "../analysis/chordDetection";

interface ChordViewProps {
  chords: ChordScore[];
  windowSeconds: number;
  /** How many ranked chords to list under the top one. */
  topN?: number;
}

export function ChordView({ chords, windowSeconds, topN = 6 }: ChordViewProps) {
  if (chords.length === 0) {
    return (
      <div className="chord-view empty">
        <h3>Accord (fenêtre {windowSeconds}s)</h3>
        <p>En attente du signal…</p>
      </div>
    );
  }
  const top = chords[0];
  const rest = chords.slice(0, topN);
  return (
    <div className="chord-view">
      <h3>Accord (fenêtre {windowSeconds}s)</h3>
      <div className="chord-top">
        <span className="chord-top-name">{top.name}</span>
        <span className="chord-top-prob">
          {(top.probability * 100).toFixed(1)}%
        </span>
      </div>
      <ol className="chord-list">
        {rest.map((c) => (
          <li key={`${c.root}-${c.quality}`}>
            <span className="chord-name">{c.name}</span>
            <div className="chord-bar">
              <div
                className="chord-bar-fill"
                style={{ width: `${(c.probability * 100).toFixed(2)}%` }}
              />
            </div>
            <span className="chord-pct">{(c.probability * 100).toFixed(1)}%</span>
            <span className="chord-sim">cos={c.similarity.toFixed(2)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
