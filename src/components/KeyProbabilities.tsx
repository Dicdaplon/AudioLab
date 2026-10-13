import type { KeyScore } from "../analysis/keyDetection";

interface KeyProbabilitiesProps {
  keys: KeyScore[];
  windowSeconds: number;
  /** How many ranked keys to list under the top one. Default 12 (all). */
  topN?: number;
  /** Optional display label, e.g. "Live acquisition" or "Tonality acquisition". */
  label?: string;
}

export function KeyProbabilities({
  keys,
  windowSeconds,
  topN = 12,
  label = "Tonalité",
}: KeyProbabilitiesProps) {
  if (keys.length === 0) {
    return (
      <div className="key-probs empty">
        <h3>
          {label} ({windowSeconds}s)
        </h3>
        <p>En attente du signal…</p>
      </div>
    );
  }
  const top = keys[0];
  const rest = keys.slice(0, topN);
  return (
    <div className="key-probs">
      <h3>
        {label} ({windowSeconds}s)
      </h3>
      <div className="key-top">
        <span className="key-top-label">Tonalité estimée</span>
        <span className="key-top-name">{top.name}</span>
        <span className="key-top-prob">{(top.probability * 100).toFixed(1)}%</span>
      </div>
      <p className="key-list-hint">
        Top {topN} sur 24 tonalités candidates (12 majeures + 12 mineures), classées par probabilité
        (softmax sur la corrélation de Pearson <code>r</code>).
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
            <span className="key-pct">{(k.probability * 100).toFixed(1)}%</span>
            <span className="key-corr">r={k.correlation.toFixed(2)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
