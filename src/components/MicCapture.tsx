interface MicCaptureProps {
  running: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function MicCapture({
  running,
  error,
  onStart,
  onStop,
  onReset,
}: MicCaptureProps) {
  return (
    <div className="mic-capture">
      {!running ? (
        <button type="button" onClick={onStart} className="mic-btn mic-start">
          Démarrer le micro
        </button>
      ) : (
        <button type="button" onClick={onStop} className="mic-btn mic-stop">
          Arrêter
        </button>
      )}
      <button
        type="button"
        onClick={onReset}
        className="mic-btn mic-reset"
        title="Vide les buffers (chromas + filter peak memory) — le micro reste actif si en cours."
      >
        Reset (vider buffers)
      </button>
      {error && <p className="error">Erreur : {error}</p>}
    </div>
  );
}
