'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isTotalTimerRunning, setIsTotalTimerRunning] = useState(false);
  const { puzzles, isLoading: puzzlesLoading, error: puzzlesError } = usePuzzles();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePuzzleStart = () => {
    setIsTotalTimerRunning(true);
  };

  const handleReset = () => {
    clearProgress();
    setProgress(initializeProgress());
    setCurrentPuzzleIndex(0);
    setTotalTime(0);
    setIsTotalTimerRunning(false);
    setIsResetDialogOpen(false);
  };

  const handleResetClick = () => {
    setIsResetDialogOpen(true);
  };

  // Export progress as JSON
  const handleExport = () => {
    const progress = getStoredProgress();
    if (!progress) return;
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'woodpecker-progress.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import progress from JSON
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // If local progress exists, prompt for overwrite
        if (getStoredProgress()) {
          setImportedData(data);
          setIsImportDialogOpen(true);
        } else {
          localStorage.setItem('woodpecker-progress', JSON.stringify(data));
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    if (importedData) {
      localStorage.setItem('woodpecker-progress', JSON.stringify(importedData));
      setIsImportDialogOpen(false);
      setImportedData(null);
      window.location.reload();
    }
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
      <ConfirmationDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onConfirm={handleImportConfirm}
        title="Import Progress"
        message="Local progress already exists. Do you want to overwrite it with the imported data? This cannot be undone."
        confirmText="Overwrite"
        cancelText="Cancel"
      />
      {/* Header with timer for mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Woodpecker</h1>
            <div className="flex items-center gap-4">
              <Timer
                initialTime={totalTime}
                onTimeUpdate={handleTimeUpdate}
                isRunning={isTotalTimerRunning}
              />
              <button
                onClick={handleExport}
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
              >
                Export
              </button>
              <button
                onClick={handleImportClick}
                className="text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
              >
                Import
              </button>
              <input
                type="file"
                accept="application/json"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                onClick={handleResetClick}
                className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header with timer for desktop */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Woodpecker Chess Puzzles</h1>
            <div className="flex items-center gap-4">
              <Timer
                initialTime={totalTime}
                onTimeUpdate={handleTimeUpdate}
                isRunning={isTotalTimerRunning}
              />
              <button
                onClick={handleExport}
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
              >
                Export
              </button>
              <button
                onClick={handleImportClick}
                className="text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
              >
                Import
              </button>
              <input
                type="file"
                accept="application/json"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                onClick={handleResetClick}
                className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with padding for header */}
      <div className="pt-16 lg:pt-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <ChessPuzzle
            puzzle={puzzles[currentPuzzleIndex]}
            onComplete={handlePuzzleComplete}
            onStart={handlePuzzleStart}
            isLastPuzzle={currentPuzzleIndex === puzzles.length - 1}
            isFirstPuzzle={currentPuzzleIndex === 0}
          />
        </div>
      </div>
    </div>
  );
}
