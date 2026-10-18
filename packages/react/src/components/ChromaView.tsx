"use client";

import type { ReactNode } from "react";

import { ChromaBars } from "./ChromaBars";
import { Panel } from "./Panel";

interface ChromaViewProps {
  chroma: Float32Array;
  title: string;
  /** Mono annotation, e.g. "8 s". */
  meta?: string;
  colourByPitch?: boolean;
  /** A compact "How?" sheet under the bars. */
  how?: ReactNode;
}

/** One chroma window in a bed panel. */
export function ChromaView({ chroma, title, meta, colourByPitch, how }: ChromaViewProps) {
  return (
    <Panel title={title} meta={meta} className="al-panel--bed" how={how}>
      <ChromaBars values={chroma} label={title} colourByPitch={colourByPitch} />
    </Panel>
  );
}
