import { memo, useRef, type KeyboardEvent } from "react";

import { panelId, tabId } from "../ui/tabIds";

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: ReadonlyArray<TabDef<T>>;
  active: T;
  onSelect: (tab: T) => void;
  /** Accessible name of the tab list. */
  label: string;
}

function TabBarInner<T extends string>({ tabs, active, onSelect, label }: TabBarProps<T>) {
  const buttons = useRef<Map<T, HTMLButtonElement>>(new Map());

  // Roving tabindex: one tab stop, arrows move and select (automatic activation).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.id === active);
    let next: number | null = null;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        next = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = tabs[next].id;
    onSelect(target);
    buttons.current.get(target)?.focus();
  };

  return (
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map(({ id, label: text }) => {
        const selected = id === active;
        return (
          <button
            key={id}
            ref={(el) => {
              if (el) buttons.current.set(id, el);
              else buttons.current.delete(id);
            }}
            type="button"
            role="tab"
            id={tabId(id)}
            className="tab"
            aria-selected={selected}
            aria-controls={panelId(id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(id)}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

/** Static tab strip; re-renders only when the active tab changes. */
export const TabBar = memo(TabBarInner) as typeof TabBarInner;
