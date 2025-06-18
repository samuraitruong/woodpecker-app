import { UserProgress, PuzzleProgress } from '../types';
import { format } from 'date-fns';

const STORAGE_KEY = 'woodpecker-progress';

export const getStoredProgress = (): UserProgress | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveProgress = (progress: UserProgress): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const resetProgress = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

export const initializeProgress = (): UserProgress => {
  return {
    currentPuzzleId: 1,
    totalTimeSpent: 0,
    completedPuzzles: [],
    lastAttemptDate: format(new Date(), 'yyyy-MM-dd'),
  };
};

export const updateProgress = (
  puzzleId: number,
  timeSpent: number,
  solution: string
): UserProgress => {
  const currentProgress = getStoredProgress() || initializeProgress();
  
  const newProgress: UserProgress = {
    ...currentProgress,
    currentPuzzleId: puzzleId + 1,
    totalTimeSpent: currentProgress.totalTimeSpent + timeSpent,
    completedPuzzles: [
      ...currentProgress.completedPuzzles,
      {
        puzzleId,
        timeSpent,
        solution,
        completedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      },
    ],
    lastAttemptDate: format(new Date(), 'yyyy-MM-dd'),
  };

  saveProgress(newProgress);
  return newProgress;
};

export const clearProgress = () => {
  localStorage.removeItem('userProgress');
}; 