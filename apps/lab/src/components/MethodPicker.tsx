import type { ReactNode } from "react";
import { Panel } from "@audiolab/react";

export interface MethodChoice<Id extends string> {
  id: Id;
  /** The method's name, as the papers call it: "pYIN", "Constant-Q + HMM". */
  name: string;
  /** "original", "experimental", "AI"… */
  tag: string;
  /** One factual sentence: what the algorithm does. */
  summary: string;
  /** The "How?" sheet of this method. */
  how: () => ReactNode;
}

interface MethodPickerProps<Id extends string> {
  /** Radio group name, unique on the page. */
  name: string;
  /** What is being chosen: "Chord detection method". */
  title: string;
  choices: readonly MethodChoice<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  /** Something to show under the cards (e.g. a status line). */
  note?: ReactNode;
}

/**
 * A row of cards to pick how a detector listens, with the "How?" sheet of
 * the chosen method underneath. One component for every page, so switching
 * methods looks and works the same everywhere.
 */
export function MethodPicker<Id extends string>({
  name,
  title,
  choices,
  value,
  onChange,
  note,
}: MethodPickerProps<Id>) {
  const chosen = choices.find((c) => c.id === value) ?? choices[0];
  return (
    <Panel className="lab-method">
      <fieldset className="lab-method__set">
        <legend className="lab-method__title">{title}</legend>
        <div className="lab-method__cards">
          {choices.map((c) => (
            <label
              key={c.id}
              className="lab-method__card"
              data-selected={c.id === value || undefined}
            >
              <input
                type="radio"
                className="al-visually-hidden"
                name={name}
                value={c.id}
                checked={c.id === value}
                onChange={() => onChange(c.id)}
              />
              <span className="lab-method__head">
                <span className="lab-method__name">{c.name}</span>
                <span className="lab-method__tag" data-tag={c.tag}>
                  {c.tag}
                </span>
              </span>
              <span className="lab-method__summary">{c.summary}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {note && <div className="al-hint lab-method__note">{note}</div>}
      <div className="lab-method__how">{chosen.how()}</div>
    </Panel>
  );
}
