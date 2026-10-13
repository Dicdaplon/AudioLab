interface MicPromptProps {
  message: string;
  onStart?: () => void;
}

/** Call to action shown by the games while the microphone is off. */
export function MicPrompt({ message, onStart }: MicPromptProps) {
  return (
    <div className="game-mic-prompt">
      <p>🎤 {message}</p>
      {onStart && (
        <button type="button" className="mic-btn mic-start" onClick={onStart}>
          Démarrer le micro
        </button>
      )}
    </div>
  );
}
