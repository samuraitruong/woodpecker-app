'use client';

import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getStoredProgress } from '../../../utils/progress';
import { usePuzzles } from '../../../hooks/usePuzzles';
import { PuzzleProgress } from '../../../types';
import { stockfish } from '../../../utils/stockfish';
import MoveList from '../../../components/MoveList';
import PositionStrengthMeter from '../../../components/PositionStrengthMeter';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface AnalysisLine {
  moves: string[];
  evaluation: number;
}

export default function ReviewPage() {
  const params = useParams();
  const [game, setGame] = useState<Chess | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComputerPlaying, setIsComputerPlaying] = useState(false);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [analysisLines, setAnalysisLines] = useState<AnalysisLine[]>([]);
  const { puzzles, isLoading } = usePuzzles();
  const [puzzleProgress, setPuzzleProgress] = useState<PuzzleProgress | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [moveList, setMoveList] = useState<any[]>([]);
  const [isViewingSolution, setIsViewingSolution] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [stockfishError, setStockfishError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return; // Wait for params.id to be available
    const progress = getStoredProgress();
    if (progress) {
      const puzzle = progress.completedPuzzles.find(p => p.puzzleId === parseInt(params.id as string));
      if (puzzle) {
        setPuzzleProgress(puzzle);
        const currentPuzzle = puzzles.find(p => p.id === parseInt(params.id as string));
        if (currentPuzzle) {
          const newGame = new Chess(currentPuzzle.fen);
          setGame(newGame);
          // Compare user solution and correct solution as arrays
          const userMoves = (puzzle.solution || '').trim().split(/\s+/).filter(Boolean);
          const correctMoves = (currentPuzzle.solution || '').trim().split(/\s+/).filter(Boolean);
          setIsCorrect(
            userMoves.length > 0 &&
            userMoves.length === correctMoves.length &&
            userMoves.every((move, idx) => move === correctMoves[idx])
          );
          setMoves(userMoves);
          // Initialize move list
          const moveList = [];
          for (let i = 0; i < userMoves.length; i += 2) {
            moveList.push({
              number: Math.floor(i / 2) + 1,
              white: userMoves[i],
              black: userMoves[i + 1],
              comment: i === 0 ? 'Starting position' : undefined
            });
          }
          setMoveList(moveList);
        }
      }
    }
  }, [params?.id, puzzles]);

  useEffect(() => {
    if (game) {
      evaluatePosition();
    }
  }, [game]);

  const evaluatePosition = async () => {
    if (!game) return;
    const { score, pv } = await stockfish.evaluatePosition(game.fen());
    setEvaluation(score);
    
    // Update move list with evaluation
    setMoveList(prev => prev.map((move, index) => ({
      ...move,
      evaluation: index === Math.floor(currentMoveIndex / 2) ? score : move.evaluation
    })));
  };

  const analyzeMultipleLines = async () => {
    if (!game) return;
    const lines: AnalysisLine[] = [];
    
    // Get top 3 lines
    for (let i = 0; i < 3; i++) {
      const { score, pv } = await stockfish.evaluatePosition(game.fen(), 15);
      lines.push({ moves: pv, evaluation: score });
    }
    
    setAnalysisLines(lines);
  };

  const handlePlayMove = () => {
    if (!game || !puzzleProgress) return;

    if (currentMoveIndex < moves.length) {
      try {
        game.move(moves[currentMoveIndex]);
        setGame(new Chess(game.fen()));
        setCurrentMoveIndex(prev => prev + 1);
      } catch (e) {
        console.error('Invalid move:', e);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handleComputerMove = async () => {
    if (!game) return;
    // Only play if it's the computer's turn
    const bestMove = await stockfish.getBestMove(game.fen());
    if (bestMove) {
      try {
        game.move(bestMove);
        setGame(new Chess(game.fen()));
        setCurrentMoveIndex((prev) => Math.min(prev + 1, moves.length - 1));
      } catch (e) {
        console.error('Invalid move:', e);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(handlePlayMove, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentMoveIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isComputerPlaying) {
      interval = setInterval(handleComputerMove, 1000);
    }
    return () => clearInterval(interval);
  }, [isComputerPlaying]);

  const handlePlay = () => {
    if (!game) return;
    setGame(new Chess(game.fen()));
    setCurrentMoveIndex(0);
    setIsPlaying(true);
    setIsComputerPlaying(false);
  };

  const handleComputerPlay = () => {
    if (!game) return;
    setGame(new Chess(game.fen()));
    setIsComputerPlaying(true);
    setIsPlaying(false);
  };

  const handlePrevMove = () => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
      const newGame = new Chess(puzzles.find(p => p.id === parseInt(params.id as string))?.fen || '');
      for (let i = 0; i < currentMoveIndex; i++) {
        newGame.move(moves[i]);
      }
      setGame(newGame);
      evaluatePosition();
    }
  };

  const handleNextMove = () => {
    if (currentMoveIndex < moves.length - 1) {
      const newGame = new Chess(puzzles.find(p => p.id === parseInt(params.id as string))?.fen || '');
      for (let i = 0; i <= currentMoveIndex + 1; i++) {
        try {
          newGame.move(moves[i]);
        } catch (e) {
          console.error('Invalid move:', e);
          return;
        }
      }
      setGame(newGame);
      setCurrentMoveIndex(currentMoveIndex + 1);
      evaluatePosition();
    }
  };

  const handleMoveClick = (index: number) => {
    if (!game) return;
    const newGame = new Chess(game.fen());
    for (let i = 0; i <= index; i++) {
      newGame.move(moves[i]);
    }
    setGame(newGame);
    setCurrentMoveIndex(index);
  };

  // Helper to get current turn
  const getTurnText = () => {
    if (!game) return '';
    return game.turn() === 'w' ? 'White to play' : 'Black to play';
  };

  // Play the correct solution moves with a delay
  const handleViewSolution = async () => {
    if (!game) return;
    setIsViewingSolution(true);
    const currentPuzzle = puzzles.find(p => p.id === parseInt(params.id as string));
    if (!currentPuzzle) return;
    const correctMoves = (currentPuzzle.solution || '').trim().split(/\s+/).filter(Boolean);
    const newGame = new Chess(currentPuzzle.fen);
    setGame(newGame);
    setCurrentMoveIndex(0);
    for (let i = 0; i < correctMoves.length; i++) {
      await new Promise(res => setTimeout(res, 2000));
      newGame.move(correctMoves[i]);
      setGame(new Chess(newGame.fen()));
      setCurrentMoveIndex(i + 1);
      await evaluatePosition();
    }
    setIsViewingSolution(false);
  };

  // Helper to check if Stockfish is available (HTTPS)
  useEffect(() => {
    if (window.location.protocol !== 'https:') {
      setStockfishError('Stockfish engine requires HTTPS. Please run the app over HTTPS for computer play.');
    } else {
      setStockfishError(null);
    }
  }, []);

  // Play vs Computer: alternate user/computer moves
  useEffect(() => {
    if (!isComputerPlaying || !game) return;
    if (!isUserTurn && game.turn() === 'b' || game.turn() === 'w') {
      // Computer's turn
      (async () => {
        const bestMove = await stockfish.getBestMove(game.fen());
        if (bestMove) {
          try {
            game.move(bestMove);
            setGame(new Chess(game.fen()));
            setCurrentMoveIndex((prev) => Math.min(prev + 1, moves.length - 1));
            setIsUserTurn(true);
            await evaluatePosition();
          } catch (e) {
            setIsComputerPlaying(false);
          }
        } else {
          setIsComputerPlaying(false);
        }
      })();
    }
  }, [isComputerPlaying, isUserTurn, game]);

  // User move handler for Play vs Computer
  const handleUserMove = (move: string) => {
    if (!isComputerPlaying || !game || !isUserTurn) return;
    try {
      game.move(move);
      setGame(new Chess(game.fen()));
      setCurrentMoveIndex((prev) => Math.min(prev + 1, moves.length - 1));
      setIsUserTurn(false);
      evaluatePosition();
    } catch (e) {
      // Invalid move
    }
  };

  if (isLoading || !game || !puzzleProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Review Puzzle #{params.id}</h1>
            <p className="mt-1 text-gray-600">
              Review your solution and see how it compares to the best moves
            </p>
            {isCorrect !== null && (
              <div className={`mt-2 text-lg font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? 'Your solution is correct!' : 'Your solution does not match the book solution.'}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div>
              <PositionStrengthMeter evaluation={evaluation || 0} />
            </div>
            
            <div className="flex-1">
              <div className="aspect-square max-w-2xl">
                <div className="mb-2 text-center text-lg font-semibold text-gray-700">{getTurnText()}</div>
                {stockfishError && (
                  <div className="mb-2 text-center text-red-600 text-sm">{stockfishError}</div>
                )}
                <Chessboard
                  position={game.fen()}
                  boardWidth={Math.min(window.innerWidth - 100, 600)}
                  arePiecesDraggable={isComputerPlaying && isUserTurn}
                  onPieceDrop={(from, to) => {
                    if (isComputerPlaying && isUserTurn) {
                      // Try to generate SAN for the move
                      try {
                        const tempGame = new Chess(game.fen());
                        const moveObj = tempGame.move({ from, to, promotion: 'q' });
                        if (moveObj) {
                          handleUserMove(moveObj.san);
                          return true;
                        }
                        return false;
                      } catch {
                        return false;
                      }
                    }
                    return false;
                  }}
                  customBoardStyle={{
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                  }}
                />
              </div>
            </div>

            <div className="w-64">
              <MoveList
                moves={moves.map(move => ({ move }))}
                currentMoveIndex={currentMoveIndex}
                onMoveClick={handleMoveClick}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={handlePrevMove}
              disabled={currentMoveIndex === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              ← Previous
            </button>

            <div className="flex gap-4">
              <button
                onClick={handlePlay}
                className={`px-4 py-2 rounded-md ${
                  isPlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPlaying ? 'Stop' : 'Play Moves'}
              </button>
              <button
                onClick={handleComputerPlay}
                className={`px-4 py-2 rounded-md ${
                  isComputerPlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={!!stockfishError || isViewingSolution}
              >
                {isComputerPlaying ? 'Stop' : 'Play vs Computer'}
              </button>
              <button
                onClick={handleViewSolution}
                disabled={isViewingSolution}
                className={`px-4 py-2 rounded-md ${
                  isViewingSolution
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isViewingSolution ? 'Playing...' : 'View Solution'}
              </button>
            </div>

            <button
              onClick={handleNextMove}
              disabled={currentMoveIndex === moves.length - 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          <div className="mt-4">
            <Link
              href="/review"
              className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              ← Back to Review List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 