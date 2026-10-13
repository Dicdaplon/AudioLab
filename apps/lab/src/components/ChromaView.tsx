import { ChromaBars } from "./ChromaBars";
import { Panel } from "./Panel";

interface ChromaViewProps {
  chroma: Float32Array;
  title: string;
  /** Mono annotation, e.g. "8 s". */
  meta?: string;
  colourByPitch?: boolean;
}

/** One chroma window in a bed panel. */
export function ChromaView({ chroma, title, meta, colourByPitch }: ChromaViewProps) {
  return (
    <Panel title={title} meta={meta} className="panel--bed">
      <ChromaBars values={chroma} label={title} colourByPitch={colourByPitch} />
    </Panel>
  );
}
