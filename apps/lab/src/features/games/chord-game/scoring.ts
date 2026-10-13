/** Score bookkeeping for the chord game, as a pure reducer. */

export interface ChordGameStats {
  score: number;
  streak: number;
  bestStreak: number;
  skipped: number;
}

export type ChordGameAction = { type: "hit" } | { type: "skip" } | { type: "reset" };

export const INITIAL_STATS: ChordGameStats = { score: 0, streak: 0, bestStreak: 0, skipped: 0 };

export function chordGameReducer(stats: ChordGameStats, action: ChordGameAction): ChordGameStats {
  switch (action.type) {
    case "hit": {
      const streak = stats.streak + 1;
      return {
        ...stats,
        score: stats.score + 1,
        streak,
        bestStreak: Math.max(stats.bestStreak, streak),
      };
    }
    case "skip":
      return { ...stats, skipped: stats.skipped + 1, streak: 0 };
    case "reset":
      return INITIAL_STATS;
  }
}
