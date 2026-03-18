export type Difficulty = "easy" | "normal" | "hard" | "nightmare";

const RANDOM_DIFFICULTIES: Difficulty[] = ["normal", "hard", "nightmare"];

export function getRandomDifficulty(): Difficulty {
  return RANDOM_DIFFICULTIES[Math.floor(Math.random() * RANDOM_DIFFICULTIES.length)];
}

export interface LeaderboardEntry {
  score: number;
  level: number;
  difficulty: Difficulty;
  date: string;
}

const STORAGE_KEY = "maze_runner_leaderboard";
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function saveScore(entry: LeaderboardEntry): { rank: number; isNewBest: boolean } {
  const board = getLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
  const rank = trimmed.findIndex(
    (e) => e.score === entry.score && e.date === entry.date && e.difficulty === entry.difficulty
  );
  const isNewBest = rank === 0;
  return { rank: rank + 1, isNewBest };
}

export function clearLeaderboard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    description: string;
    color: string;
    enemyMultiplier: number;
    speedMultiplier: number;
    timeMultiplier: number;
    healthMultiplier: number;
    scoreMultiplier: number;
  }
> = {
  easy: {
    label: "EASY",
    description: "Fewer enemies, more time, extra health",
    color: "#44cc88",
    enemyMultiplier: 0.6,
    speedMultiplier: 0.8,
    timeMultiplier: 1.4,
    healthMultiplier: 1.5,
    scoreMultiplier: 0.5,
  },
  normal: {
    label: "NORMAL",
    description: "The standard dungeon experience",
    color: "#d2882a",
    enemyMultiplier: 1.0,
    speedMultiplier: 1.0,
    timeMultiplier: 1.0,
    healthMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  hard: {
    label: "HARD",
    description: "More enemies, faster, less time",
    color: "#cc2233",
    enemyMultiplier: 1.5,
    speedMultiplier: 1.3,
    timeMultiplier: 0.75,
    healthMultiplier: 0.75,
    scoreMultiplier: 1.5,
  },
  nightmare: {
    label: "NIGHTMARE",
    description: "Maximum enemies, minimal time, fragile",
    color: "#aa22ff",
    enemyMultiplier: 2.0,
    speedMultiplier: 1.6,
    timeMultiplier: 0.5,
    healthMultiplier: 0.5,
    scoreMultiplier: 2.5,
  },
};
