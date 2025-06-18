'use client';

import { useEffect, useState } from 'react';
import { UserProgress } from '../../types';
import { getStoredProgress, clearProgress } from '../../utils/progress';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfirmationDialog from '../../components/ConfirmationDialog';

export default function CongratulationsPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    const storedProgress = getStoredProgress();
    if (storedProgress) {
      setProgress(storedProgress);
      setTotalTime(storedProgress.totalTimeSpent);
    }
  }, []);

  const handleReset = () => {
    clearProgress();
    router.push('/');
  };

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleReset}
        title="Start Over"
        message="Are you sure you want to start over? This will clear all your progress and restart from the beginning."
        confirmText="Start Over"
        cancelText="Cancel"
      />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-green-600">Congratulations! 🎉</h1>
          <div className="space-y-4">
            <p className="text-xl text-center text-gray-800">
              You have completed all puzzles!
            </p>
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Summary</h2>
              <p className="text-gray-700">
                Total time spent: {Math.floor(totalTime / 60)} minutes and {totalTime % 60} seconds
              </p>
              <p className="text-gray-700">
                Puzzles completed: {progress.completedPuzzles.length}
              </p>
              <div className="mt-6 flex gap-4 justify-center">
                <Link
                  href="/review"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Review Puzzles
                </Link>
                <button
                  onClick={() => setIsResetDialogOpen(true)}
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 