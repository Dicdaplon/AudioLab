import { useEffect, useState } from "react";

import type { BasicPitchRunner } from "./basicPitchRunner";

export interface BasicPitchRunnerState {
  runner: BasicPitchRunner | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Loads the Basic Pitch runner (onnxruntime-web + the 230 KB model, in a
 * worker) only while `enabled`, and disposes of it when it turns false or
 * the component unmounts. Nothing is downloaded until the AI method is
 * picked.
 */
export function useBasicPitchRunner(enabled: boolean): BasicPitchRunnerState {
  const [state, setState] = useState<BasicPitchRunnerState>({
    runner: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ runner: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    let runner: BasicPitchRunner | null = null;
    setState({ runner: null, loading: true, error: null });
    import("./basicPitchRunner")
      .then(({ createBasicPitchRunner }) => createBasicPitchRunner())
      .then((r) => {
        if (cancelled) {
          r.dispose();
          return;
        }
        runner = r;
        setState({ runner: r, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            runner: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });
    return () => {
      cancelled = true;
      runner?.dispose();
    };
  }, [enabled]);

  return state;
}
