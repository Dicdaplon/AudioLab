import type { KeyScore } from "../analysis/keyDetection";
import { NOTE_NAMES } from "../utils/notes";

interface ToneBaseTonalityViewProps {
  /** Mean presence histogram (∈ [0, 1] per pitch class). */
  presence: Float32Array;
  /** Filtered live chroma (values that passed the high-water-mark threshold). */
  filteredLiveChroma: Float32Array;
  /** Binary presence indicator from the current frame. */
  presenceIndicator: Float32Array;
  /** Tonality ranking derived from the presence histogram. */
  keys: KeyScore[];
  liveSeconds: number;
  tonalitySeconds: number;
  topN?: number;
}

function PresenceBars({
  values,
  title,
  max,
}: {
  values: Float32Array;
  title: string;
  max?: number;
}) {
  const m = max ?? Math.max(1e-9, ...Array.from(values));
  return (
    <div className="presence-bars">
      <h4>{title}</h4>
      <div className="chroma-bars">
        {NOTE_NAMES.map((name, i) => {
          const v = values[i] ?? 0;
          const height = Math.round((v / m) * 100);
          return (
            <div key={name} className="chroma-bar">
              <div className="chroma-bar-fill" style={{ height: `${height}%` }} />
              <span className="chroma-bar-label">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ToneBaseTonalityView({
  presence,
  filteredLiveChroma,
  presenceIndicator,
  keys,
  liveSeconds,
  tonalitySeconds,
  topN = 5,
}: ToneBaseTonalityViewProps) {
  const top = keys[0];
  const rest = keys.slice(0, topN);

  return (
    <div className="tone-base">
      <h3>
        ToneBaseTonality (présence) · {liveSeconds}s → {tonalitySeconds}s
      </h3>

      <div className="tone-base-bars">
        <PresenceBars title="Live chroma filtré" values={filteredLiveChroma} />
        <PresenceBars
          title="Indicateur courant (0/1)"
          values={presenceIndicator}
          max={1}
        />
        <PresenceBars title={`Présence ${tonalitySeconds}s`} values={presence} max={1} />
      </div>

      {top ? (
        <>
          <div className="key-top">
            <span className="key-top-label">Tonalité (présence)</span>
            <span className="key-top-name">{top.name}</span>
            <span className="key-top-prob">
              {(top.probability * 100).toFixed(1)}%
            </span>
          </div>
          <p className="key-list-hint">
            Top {topN} sur 24 candidats — corrélation Krumhansl-Schmuckler sur
            l'histogramme de présence (et non l'énergie).
          </p>
          <ol className="key-list">
            {rest.map((k) => (
              <li key={`${k.tonic}-${k.mode}`}>
                <span className="key-name">{k.name}</span>
                <div className="key-bar">
                  <div
                    className="key-bar-fill"
                    style={{ width: `${(k.probability * 100).toFixed(2)}%` }}
                  />
                </div>
                <span className="key-pct">
                  {(k.probability * 100).toFixed(1)}%
                </span>
                <span className="key-corr">r={k.correlation.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="empty">En attente du signal…</p>
      )}
    </div>
  );
}
