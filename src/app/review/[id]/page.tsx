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
import AnalysisLines from '../../../components/AnalysisLines';
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
  const [userColor, setUserColor] = useState<'w' | 'b' | null>(null);
  const [actualMoves, setActualMoves] = useState<string[]>([]);
  const [pendingComputerMove, setPendingComputerMove] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [showBestMovesAfterMove, setShowBestMovesAfterMove] = useState(false);
  const [analyzedFen, setAnalyzedFen] = useState<string>('');

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

  // Run analysis when game changes during computer play
  useEffect(() => {
    if (game && isComputerPlaying) {
      analyzeMultipleLines();
    }
  }, [game]);

  const evaluatePosition = async () => {
    if (!game) return;
    // Don't reset evaluation here, only update on new data
    // setEvaluation(null); 
    
    const { score, pv } = await stockfish.evaluatePosition(game.fen());
    setEvaluation(score);
    
    // Update move list with evaluation - This seems incorrect as it's not a list of moves
    // setMoveList(prev => prev.map((move, index) => ({
    //   ...move,
    //   evaluation: index === Math.floor(currentMoveIndex / 2) ? score : move.evaluation
    // })));
  };

  const analyzeMultipleLines = async () => {
    if (!game) return;
    
    // Always use the current game state
    let positionToAnalyze = game.fen();
    
    // If checkbox is checked, analyze position after player's move
    if (showBestMovesAfterMove && isComputerPlaying && userColor) {
      // Create a copy of the game and make the best move for the current player
      const gameCopy = new Chess(game.fen());
      const bestMove = await stockfish.getBestMove(game.fen());
      if (bestMove) {
        try {
          const moveObj = gameCopy.move(bestMove);
          if (moveObj) {
            positionToAnalyze = gameCopy.fen();
          }
        } catch (e) {
          console.error('Error making best move for analysis:', e);
        }
      }
    }
    
    // Store the FEN being analyzed for debugging
    setAnalyzedFen(positionToAnalyze);
    
    const lines = await stockfish.analyzeMultipleLines(positionToAnalyze, 15, 4);
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
    console.log('handleComputerMove');
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


  const handlePlay = () => {
    if (!game) return;
    setGame(new Chess(game.fen()));
    setCurrentMoveIndex(0);
    setIsPlaying(true);
    setIsComputerPlaying(false);
  };

  // Play vs Computer: event-driven, no interval
  useEffect(() => {
    const playComputerMove = async () => {
      if (game && isComputerPlaying && userColor && game.turn() !== userColor) {
        // Computer's turn
        const bestMove = await stockfish.getBestMove(game.fen());
        if (bestMove) {
          try {
            const gameCopy = new Chess(game.fen());
            const moveObj = gameCopy.move(bestMove);
            if (moveObj) {
              setGame(new Chess(gameCopy.fen()));
              setActualMoves((prev) => [...prev, moveObj.san]);
              setCurrentMoveIndex((prev) => prev + 1);
              setLastMove({ from: moveObj.from, to: moveObj.to });
            } else {
              setIsComputerPlaying(false);
            }
          } catch (e) {
            console.error('Computer move error:', e);
            setIsComputerPlaying(false);
          }
        } else {
          setIsComputerPlaying(false);
        }
      }
    };

    playComputerMove();
  }, [isComputerPlaying, game, userColor]);

  // When Play vs Computer starts, lock user color and reset actualMoves
  const handleComputerPlay = async () => {
    if (!game) return;
    const fenParts = game.fen().split(' ');
    const turn = fenParts[1] as 'w' | 'b';

    setUserColor(turn);
    setActualMoves([]);
    const newGame = new Chess(game.fen());
    setGame(newGame);
    setCurrentMoveIndex(0);
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

  // Custom arrow component
  const ArrowOverlay = ({ from, to }: { from: string; to: string }) => {
    if (!from || !to) return null;
    
    const boardSize = Math.min(window.innerWidth - 100, 600);
    const squareSize = boardSize / 8;
    
    // Convert chess notation to pixel coordinates
    const fileToX = (file: string) => (file.charCodeAt(0) - 'a'.charCodeAt(0)) * squareSize + squareSize / 2;
    const rankToY = (rank: string) => (8 - parseInt(rank)) * squareSize + squareSize / 2;
    
    const fromX = fileToX(from[0]);
    const fromY = rankToY(from[1]);
    const toX = fileToX(to[0]);
    const toY = rankToY(to[1]);
    
    // Calculate arrow properties
    const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: boardSize,
          height: boardSize,
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              fill="#ff6b6b"
              opacity="0.9"
            />
          </marker>
        </defs>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke="#ff6b6b"
          strokeWidth="8"
          opacity="0.9"
          markerEnd="url(#arrowhead)"
        />
      </svg>
    );
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

  // User move handler for Play vs Computer (only updates state, does not call game.move)
  const handleUserMove = async (move: string, newFen: string) => {
    if (!game || !isComputerPlaying || !userColor) return;
    if (game.turn() === userColor) {
      try {
        const gameCopy = new Chess(game.fen());
        const moveObj = gameCopy.move(move);
        if (moveObj) {
          setLastMove({ from: moveObj.from, to: moveObj.to });
          setGame(new Chess(gameCopy.fen()));
          setActualMoves((prev) => [...prev, moveObj.san]);
          setCurrentMoveIndex((prev) => prev + 1);
        }
      } catch (e) {
        // This is not a valid move, do nothing
        console.log('Invalid user move:', e);
      }
    }
  };

  const handleResetComputerPlay = () => {
    if (!puzzles || !params?.id) return;
    const currentPuzzle = puzzles.find(p => p.id === parseInt(params.id as string));
    if (currentPuzzle) {
        const newGame = new Chess(currentPuzzle.fen);
        setGame(newGame);
        setUserColor(null);
        setActualMoves([]);
        setCurrentMoveIndex(0);
        setIsComputerPlaying(false);
        setIsPlaying(false);
        setLastMove(null);
        setEvaluation(null);
        setAnalysisLines([]);
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
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex flex-1 gap-2">
              <div>
                <PositionStrengthMeter fen={game.fen()}
                />
              </div>
              
              <div className="flex-1">
                <div className="aspect-square max-w-2xl mx-auto lg:mx-0">
                  <div className="mb-2 text-center text-lg font-semibold text-gray-700">{getTurnText()}</div>
                  {stockfishError && (
                    <div className="mb-2 text-center text-red-600 text-sm">{stockfishError}</div>
                  )}
                  <div className="relative">
                    <Chessboard
                      position={game.fen()}
                      boardWidth={Math.min(window.innerWidth - 100, 600)}
                      arePiecesDraggable={isComputerPlaying && userColor === game.turn()}
                      onPieceDrop={(from, to) => {
                        console.log('onPieceDrop');
                        console.log(isComputerPlaying, userColor, game.turn());
                        if (isComputerPlaying && userColor === game.turn()) {
                          try {
                            const tempGame = new Chess(game.fen());
                            const moveObj = tempGame.move({ from, to, promotion: 'q' });
                            if (moveObj) {
                              // Apply the move and update state
                              handleUserMove(moveObj.san, tempGame.fen());
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
                    {lastMove && (
                      <ArrowOverlay from={lastMove.from} to={lastMove.to} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              {isComputerPlaying && (
                <div className="mb-2">
                  <div className="p-2 bg-gray-50 rounded">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showBestMovesAfterMove}
                        onChange={(e) => setShowBestMovesAfterMove(e.target.checked)}
                        className="rounded"
                      />
                      <span>Show best moves after my move</span>
                    </label>
                  </div>
                  <AnalysisLines lines={analysisLines} analyzedFen={analyzedFen} />
                </div>
              )}

              <MoveList
                moves={isComputerPlaying ? actualMoves.map(move => ({ move })) : moves.map(move => ({ move }))}
                currentMoveIndex={currentMoveIndex}
                onMoveClick={handleMoveClick}
                showMoveNumbers={!isComputerPlaying}
              />

              {isComputerPlaying && (
                <button
                  className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                  onClick={() => {
                    if (!game) return;
                    // Reset to initial puzzle position
                    const currentPuzzle = puzzles.find(p => p.id === parseInt(params.id as string));
                    if (currentPuzzle) {
                      setGame(new Chess(currentPuzzle.fen));
                      setActualMoves([]);
                      setCurrentMoveIndex(0);
                      setLastMove(null);
                    }
                  }}
                >
                  Reset Computer Play
                </button>
              )}

              {!isComputerPlaying && isCorrect !== null && (
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-base font-semibold text-gray-700 mb-1">
                    {isCorrect ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Your solution is correct!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Your solution does not match the book solution.
                      </span>
                    )}
                  </span>
                </div>
              )}
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

            <div className="flex gap-4 items-center">
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
              onClick={handleResetComputerPlay}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Reset Computer Play
            </button>

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