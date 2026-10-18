"use client";

/**
 * "How?": a discreet disclosure under a feature that explains how it works,
 * in a few lines and a miniature diagram. Closed it is one quiet line;
 * open, a small sheet: the idea, then the algorithm, its limits, where it
 * comes from, and one thing worth knowing.
 *
 * `compact` is the small version that closes a panel (one window of the
 * detector, a list): a smaller bar, one column, the diagram optional.
 *
 * A native <details>, so it opens without JavaScript and is accessible by
 * default. Keep the text short: the lead is two or three sentences, each
 * field one or two.
 */

import type { ReactNode } from "react";

export interface HowSource {
  /** "Krumhansl & Kessler, 1982". */
  label: string;
  url?: string;
}

export interface HowPanelProps {
  /** Shown next to "How?" when closed: what is being explained. */
  topic: string;
  /** The miniature diagram (see `SketchChain` and the `Sketch*` primitives). */
  diagram?: ReactNode;
  /** The idea, in two or three sentences. */
  children: ReactNode;
  /** The algorithm, named and summed up. */
  algorithm?: ReactNode;
  /** What it gets wrong. */
  limits?: ReactNode;
  /** The papers or sources it comes from. */
  sources?: readonly HowSource[];
  /** One extra thing worth knowing. */
  aside?: ReactNode;
  /** Start open. Default false. */
  defaultOpen?: boolean;
  /** The small version, for the foot of a panel. Default false. */
  compact?: boolean;
  /** Heading of the closed bar. Default "How?". */
  title?: string;
  className?: string;
}

export function HowPanel({
  topic,
  diagram,
  children,
  algorithm,
  limits,
  sources,
  aside,
  title = "How?",
  defaultOpen = false,
  compact = false,
  className,
}: HowPanelProps) {
  const classes = ["al-how", compact && "al-how--compact", className].filter(Boolean).join(" ");
  return (
    <details className={classes} open={defaultOpen || undefined}>
      <summary className="al-how__bar">
        <span className="al-how__title">{title}</span>
        <span className="al-how__topic">{topic}</span>
        <span className="al-how__chevron" aria-hidden="true" />
      </summary>
      <div className="al-how__sheet">
        {diagram && <div className="al-how__diagram">{diagram}</div>}
        <div className="al-how__text">
          <div className="al-how__lead">{children}</div>
          <dl className="al-how__facts">
            {algorithm && (
              <div className="al-how__fact">
                <dt className="al-surtitre">Algorithm</dt>
                <dd>{algorithm}</dd>
              </div>
            )}
            {limits && (
              <div className="al-how__fact">
                <dt className="al-surtitre">Limits</dt>
                <dd>{limits}</dd>
              </div>
            )}
            {sources && sources.length > 0 && (
              <div className="al-how__fact">
                <dt className="al-surtitre">From</dt>
                <dd>
                  {sources.map((s, i) => (
                    <span key={s.label}>
                      {i > 0 && " · "}
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.label}
                        </a>
                      ) : (
                        s.label
                      )}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {aside && (
              <div className="al-how__fact">
                <dt className="al-surtitre">Worth knowing</dt>
                <dd>{aside}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </details>
  );
}
