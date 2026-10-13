import { Icon } from "../ui/Icon";

interface MicNoticeProps {
  /** User-facing message from the audio layer. */
  message: string;
  /**
   * "unsupported": the environment cannot capture at all (no retry).
   * "error": the last start failed (retry offered).
   */
  kind: "unsupported" | "error";
  onRetry?: () => void;
}

/**
 * Microphone failure, announced as an alert. The retry is the primary
 * action; the browser recipes sit behind a disclosure so the message
 * stays short.
 */
export function MicNotice({ message, kind, onRetry }: MicNoticeProps) {
  return (
    <div className="notice notice--danger" role="alert">
      <Icon name="warning" className="notice__icon" />
      <div className="notice__body">
        <p className="notice__text">{message}</p>
        {kind === "error" && (
          <details className="notice__details">
            <summary>How to allow the microphone again</summary>
            <ul className="notice__list">
              <li>
                <strong>Chrome / Edge:</strong> click the lock icon in the address bar, set
                Microphone to Allow, then reload.
              </li>
              <li>
                <strong>Firefox:</strong> click the microphone icon in the address bar, remove the
                blocked permission, then start again.
              </li>
              <li>
                <strong>Safari:</strong> Safari menu → Settings for this website → Microphone →
                Allow.
              </li>
            </ul>
          </details>
        )}
        {kind === "error" && onRetry && (
          <div className="notice__actions">
            <button type="button" className="btn btn--accent" onClick={onRetry}>
              <Icon name="mic" />
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
