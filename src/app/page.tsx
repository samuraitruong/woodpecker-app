'use client';

import { useState, useEffect } from 'react';
import ChessPuzzle from '../components/ChessPuzzle';
import Timer from '../components/Timer';
import { UserProgress } from '../types';
import { getStoredProgress, initializeProgress, clearProgress } from '../utils/progress';
import { usePuzzles } from '../hooks/usePuzzles';
import Link from 'next/link';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { puzzles, isLoading: puzzlesLoading, error: puzzlesError } = usePuzzles();

  useEffect(() => {
    const storedProgress = getStoredProgress();
    if (storedProgress) {
      setProgress(storedProgress);
      setCurrentPuzzleIndex(storedProgress.currentPuzzleId - 1);
      setTotalTime(storedProgress.totalTimeSpent);
    } else {
      setProgress(initializeProgress());
    }
  }, []);

  useEffect(() => {
    if (!progress || !puzzles.length) return;

    const hasCompletedAllPuzzles = progress.completedPuzzles.length === puzzles.length;
    const isBeyondLastPuzzle = currentPuzzleIndex >= puzzles.length;

    if (hasCompletedAllPuzzles && isBeyondLastPuzzle) {
      router.push('/congratulations');
    }
  }, [currentPuzzleIndex, puzzles.length, router, progress]);

  const handlePuzzleComplete = (timeSpent: number) => {
    setTotalTime(prev => prev + timeSpent);
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setTotalTime(time);
  };

  const handleReset = () => {
    clearProgress();
    setProgress(initializeProgress());
    setCurrentPuzzleIndex(0);
    setTotalTime(0);
    setIsResetDialogOpen(false);
  };

  const handleResetClick = () => {
    setIsResetDialogOpen(true);
  };

  if (puzzlesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading puzzles...</div>
      </div>
    );
  }

  if (puzzlesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">
          Error loading puzzles: {puzzlesError.message}
        </div>
      </div>
    );
  }

  if (!puzzles.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">No puzzles available</div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleReset}
        title="Reset Progress"
        message="Are you sure you want to reset all progress? This will clear your completed puzzles and restart from the beginning."
        confirmText="Reset"
        cancelText="Cancel"
      />
      {/* Header with timer for mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Woodpecker</h1>
            <Timer
              initialTime={totalTime}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        </div>
      </div>

      {/* Header with timer for desktop */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Woodpecker Chess Puzzles</h1>
            <Timer
              initialTime={totalTime}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        </div>
      </div>

      {/* Main content with padding for header */}
      <div className="pt-16 lg:pt-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <ChessPuzzle
            puzzle={puzzles[currentPuzzleIndex]}
            onComplete={handlePuzzleComplete}
            isLastPuzzle={currentPuzzleIndex === puzzles.length - 1}
          />
        </div>
      </div>
    </div>
  );
}
