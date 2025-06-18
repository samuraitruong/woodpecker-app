import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

interface ChessPreviewProps {
  fen: string;
  solution: string;
  onPositionChange: (fen: string) => void;
}

export default function ChessPreview({ fen, solution, onPositionChange }: ChessPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const moves = solution.split(' ');
  const [game] = useState(new Chess(fen));

  const handleMoveClick = (index: number) => {
    const newGame = new Chess(fen);
    for (let i = 0; i <= index; i++) {
      if (moves[i]) {
        newGame.move(moves[i]);
      }
    }
    setCurrentIndex(index);
    onPositionChange(newGame.fen());
  };

  return (
    <div className="flex items-start gap-4">
      <div className="w-[120px] h-[120px]">
        <Chessboard
          position={fen}
          boardWidth={120}
          boardOrientation="white"
          arePiecesDraggable={false}
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-700 mb-2">Solution Preview</div>
        <div className="flex flex-wrap gap-1">
          {moves.map((move, index) => (
            <button
              key={index}
              onClick={() => handleMoveClick(index)}
              className={`px-2 py-1 text-xs rounded ${
                index === currentIndex
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {move}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 