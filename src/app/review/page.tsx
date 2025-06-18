'use client';

import { useState, useEffect } from 'react';
import { getStoredProgress } from '../../utils/progress';
import { usePuzzles } from '../../hooks/usePuzzles';
import Link from 'next/link';
import ChessPreview from '../../components/ChessPreview';

const ITEMS_PER_PAGE = 5;

export default function ReviewListPage() {
  const [progress, setProgress] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { puzzles, isLoading } = usePuzzles();

  useEffect(() => {
    const storedProgress = getStoredProgress();
    if (storedProgress) {
      setProgress(storedProgress);
    }
  }, []);

  if (isLoading || !progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const totalPages = Math.ceil(progress.completedPuzzles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPuzzles = progress.completedPuzzles.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Review Puzzles</h1>
            <p className="mt-2 text-gray-600">
              Review your completed puzzles and see your solutions
            </p>
          </div>

          <div className="space-y-6">
            {currentPuzzles.map((puzzle: any) => {
              const puzzleData = puzzles.find(p => p.id === puzzle.puzzleId);
              const isCorrect = puzzle.solution === puzzleData?.solution;

              return (
                <div key={puzzle.puzzleId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Puzzle #{puzzle.puzzleId}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Time spent: {Math.floor(puzzle.timeSpent / 60)}m {puzzle.timeSpent % 60}s
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </div>
                      <Link
                        href={`/review/${puzzle.puzzleId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Review →
                      </Link>
                    </div>
                  </div>

                  {puzzleData && (
                    <ChessPreview
                      fen={puzzleData.fen}
                      solution={puzzle.solution || ''}
                      onPositionChange={() => {}}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              ← Back to Puzzles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 