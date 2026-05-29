import { NOTE_NAMES } from "../utils/notes";

interface ChromaViewProps {
  chroma: Float32Array;
  title?: string;
}

export function ChromaView({ chroma, title }: ChromaViewProps) {
  const max = Math.max(1e-9, ...Array.from(chroma));
  return (
    <div className="chroma-view">
      {title && <h3>{title}</h3>}
      <div className="chroma-bars">
        {NOTE_NAMES.map((name, i) => {
          const value = chroma[i] ?? 0;
          const height = Math.round((value / max) * 100);
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
