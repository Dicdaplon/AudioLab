import { Icon } from "../../ui/Icon";

interface MicPromptProps {
  message: string;
  onStart?: () => void;
}

/** Call to action shown by the games while the microphone is off. */
export function MicPrompt({ message, onStart }: MicPromptProps) {
  return (
    <div className="notice notice--accent notice--mic">
      <Icon name="mic" className="notice__icon" />
      <div className="notice__body">
        <p className="notice__text">{message}</p>
        {onStart && (
          <div className="notice__actions">
            <button type="button" className="btn btn--accent btn--touch" onClick={onStart}>
              <Icon name="mic" />
              Start microphone
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
