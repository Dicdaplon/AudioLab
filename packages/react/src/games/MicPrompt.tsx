"use client";

import { Icon } from "../ui/Icon";

interface MicPromptProps {
  message: string;
  onStart?: () => void;
}

/** Call to action shown by the games while the microphone is off. */
export function MicPrompt({ message, onStart }: MicPromptProps) {
  return (
    <div className="al-notice al-notice--accent al-notice--mic">
      <Icon name="mic" className="al-notice__icon" />
      <div className="al-notice__body">
        <p className="al-notice__text">{message}</p>
        {onStart && (
          <div className="al-notice__actions">
            <button type="button" className="al-btn al-btn--accent al-btn--touch" onClick={onStart}>
              <Icon name="mic" />
              Start microphone
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
