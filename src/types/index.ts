export interface Puzzle {
  id: number;
  fen: string;
  solution: string;
  description: string;
}

export interface PuzzleProgress {
  puzzleId: number;
  timeSpent: number;
  solution: string;
  completedAt: string;
}

export interface UserProgress {
  currentPuzzleId: number;
  totalTimeSpent: number;
  completedPuzzles: PuzzleProgress[];
  lastAttemptDate: string;
} 