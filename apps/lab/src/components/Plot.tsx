import type { CSSProperties, ReactNode, RefObject } from "react";

export interface LegendItem {
  label: string;
  /** "line" (solid) or "dash". */
  kind: "line" | "dash";
  /** A CSS colour, usually a var(--viz-*) reference. */
  colour: string;
}

interface PlotFigureProps {
  title: string;
  /** Mono annotation after the title, e.g. "0–4 kHz · floor −71.3 dB". */
  meta?: ReactNode;
  legend?: LegendItem[];
  xLabel: string;
  yLabel: string;
  /** The frame the canvas is measured against. */
  frameRef: RefObject<HTMLDivElement>;
  children: ReactNode;
}

/**
 * The frame around a canvas plot. Title, legend and axis titles are DOM so
 * they get the right font, theme and screen-reader exposure; the canvas
 * only draws data.
 */
export function PlotFigure({
  title,
  meta,
  legend,
  xLabel,
  yLabel,
  frameRef,
  children,
}: PlotFigureProps) {
  return (
    <figure className="plot">
      <figcaption className="plot__head">
        <span className="plot__title">{title}</span>
        {meta && <span className="plot__meta num">{meta}</span>}
        {legend && legend.length > 0 && (
          <ul className="plot__legend">
            {legend.map((item) => (
              <li key={item.label}>
                <i
                  className={`key key--${item.kind}`}
                  style={{ "--c": item.colour } as CSSProperties}
                  aria-hidden="true"
                />
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </figcaption>
      <div className="plot__body">
        <span className="plot__axis plot__axis--y">{yLabel}</span>
        <div className="plot__frame" ref={frameRef}>
          {children}
        </div>
        <span className="plot__axis plot__axis--x">{xLabel}</span>
      </div>
    </figure>
  );
}
