import type { ReactNode } from "react";

interface PanelProps {
  /** Sentence-case title. Window lengths and sizes go in `meta`, not here. */
  title?: ReactNode;
  /** Mono annotation next to the title, e.g. "8 s" or "FFT 16384". */
  meta?: ReactNode;
  /** Extra classes: panel--bed, panel--quiet, panel--settings. */
  className?: string;
  as?: "div" | "section";
  children: ReactNode;
}

/** The surface every block of the lab sits on. */
export function Panel({ title, meta, className, as: Tag = "div", children }: PanelProps) {
  return (
    <Tag className={className ? `panel ${className}` : "panel"}>
      {(title || meta) && (
        <div className="panel__head">
          {title && <h2 className="panel__title">{title}</h2>}
          {meta && <span className="panel__meta num">{meta}</span>}
        </div>
      )}
      {children}
    </Tag>
  );
}
