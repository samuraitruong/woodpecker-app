import { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Puzzle } from '../types';
import { updateProgress, getStoredProgress, resetProgress } from '../utils/progress';
import ConfirmationDialog from './ConfirmationDialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface ChessPuzzleProps {
  puzzle: Puzzle;
  onComplete: (timeSpent: number) => void;
  onStart?: () => void;
  isLastPuzzle?: boolean;
  isFirstPuzzle?: boolean;
}

export default function ChessPuzzle({ puzzle, onComplete, onStart, isLastPuzzle = false, isFirstPuzzle = false }: ChessPuzzleProps) {
  const router = useRouter();
  const [game, setGame] = useState<Chess | null>(null);
  const [solution, setSolution] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [puzzleTime, setPuzzleTime] = useState(0);
  const [isPuzzleTimerRunning, setIsPuzzleTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasStartedAnyPuzzle, setHasStartedAnyPuzzle] = useState(false);

  useEffect(() => {
    if (puzzle?.fen) {
      const newGame = new Chess(puzzle.fen);
      setGame(newGame);
      setStartTime(null);
      setIsComplete(false);
      setSolution('');
      setPuzzleTime(0);
      setIsPuzzleTimerRunning(false);
      setError(null);
      setMoveHistory([]);
      setHasStarted(false);
    }
  }, [puzzle]);

  useEffect(() => {
    // Auto-start timer for subsequent puzzles after user has started solving
    if (hasStartedAnyPuzzle && !hasStarted && !isComplete && puzzle?.fen) {
      const now = Date.now();
      setStartTime(now);
      setIsPuzzleTimerRunning(true);
      setHasStarted(true);
    }
  }, [puzzle, hasStartedAnyPuzzle, hasStarted, isComplete]);

  useEffect(() => {
    if (!isPuzzleTimerRunning || !startTime) return;
    const interval = setInterval(() => {
      setPuzzleTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPuzzleTimerRunning, startTime]);

  const handleStart = () => {
    setStartTime(Date.now());
    setIsPuzzleTimerRunning(true);
    setHasStarted(true);
    setHasStartedAnyPuzzle(true);
    onStart?.();
  };

  const validateSolution = (moves: string[]): boolean => {
    const tempGame = new Chess(puzzle.fen);
    for (const move of moves) {
      try {
        tempGame.move(move);
      } catch (e) {
        setError(`Invalid move: ${move}`);
        return false;
      }
    }
    return true;
  };

  const handleSolve = useCallback(() => {
    if (!startTime) {
      setError('Please start the timer first');
      return;
    }

    if (!solution.trim()) {
      setError('Please enter your solution');
      return;
    }

    const moves = solution.trim().split(' ');
    if (!validateSolution(moves)) {
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    updateProgress(puzzle.id, timeSpent, solution);
    setIsComplete(true);
    setIsPuzzleTimerRunning(false);
    onComplete(timeSpent);
  }, [puzzle.id, solution, startTime, onComplete]);

  const handleSkip = useCallback(() => {
    if (!startTime) {
      setError('Please start the timer first');
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    updateProgress(puzzle.id, timeSpent, '');
    setIsComplete(true);
    setIsPuzzleTimerRunning(false);
    onComplete(timeSpent);
  }, [puzzle.id, startTime, onComplete]);

  const handleReset = () => {
    setIsResetDialogOpen(true);
  };

  const handleResetConfirm = () => {
    resetProgress();
    window.location.reload();
  };

  const handleReview = () => {
    if (isLastPuzzle) {
      router.push('/congratulations');
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (!game || isComplete) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move === null) return false;

      setGame(new Chess(game.fen()));
      
      // Add move to history and update solution
      const newMoveHistory = [...moveHistory, move.san];
      setMoveHistory(newMoveHistory);
      setSolution(newMoveHistory.join(' '));
      setError(null);

      return true;
    } catch (error) {
      return false;
    }
  };

  const resetBoard = () => {
    if (puzzle?.fen) {
      const newGame = new Chess(puzzle.fen);
      setGame(newGame);
      setSolution('');
      setMoveHistory([]);
      setError(null);
    }
  };

  if (!puzzle || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-0">Puzzle #{puzzle.id}</h2>
          <div className="w-32">
            {!hasStartedAnyPuzzle && !hasStarted && !isComplete && (
              <button
                onClick={handleStart}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Start
              </button>
            )}
            {hasStarted && (
              <div className="w-full font-mono text-lg font-semibold bg-gray-100 text-gray-900 px-4 py-2 rounded shadow-sm text-center">
                {formatTime(puzzleTime)}
              </div>
            )}
          </div>
        </div>
        <p className="text-base text-gray-700 mb-2">{puzzle.description}</p>

        <div className="mb-6 flex justify-center">
          <div className="w-[400px] h-[400px]">
            <Chessboard
              position={game.fen()}
              boardWidth={400}
              boardOrientation="white"
              arePiecesDraggable={!isComplete && hasStarted}
              onPieceDrop={onDrop}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="solution" className="block text-sm font-medium text-gray-800 mb-2">
            Your solution:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="solution"
              value={solution}
              onChange={(e) => {
                setSolution(e.target.value);
                setError(null);
              }}
              className={`flex-1 px-3 py-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400`}
              placeholder="Play moves on the board or type here..."
              readOnly={isComplete || !hasStarted}
            />
            <button
              onClick={resetBoard}
              disabled={isComplete || !hasStarted}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 text-sm"
              title="Reset puzzle and try again"
            >
              ↺
            </button>
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-2">
          {isComplete ? (
            <button
              onClick={handleReview}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Review
            </button>
          ) : (
            <>
              <button
                onClick={handleSolve}
                disabled={!hasStarted}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Solve
              </button>
              <button
                onClick={handleSkip}
                disabled={!hasStarted}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Skip
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset Progress"
        message="Are you sure you want to reset your progress? This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
      />
    </div>
  );
} 