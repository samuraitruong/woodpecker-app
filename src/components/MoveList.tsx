import { useState } from 'react';

interface Move {
  move: string;
  evaluation?: number;
  comment?: string;
}

interface MoveListProps {
  moves: Move[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
  showMoveNumbers?: boolean;
}

export default function MoveList({ moves, currentMoveIndex, onMoveClick, showMoveNumbers = true }: MoveListProps) {
  const [expandedMove, setExpandedMove] = useState<number | null>(null);

  const formatEvaluation = (evaluation: number) => {
    if (evaluation > 0) return `+${evaluation.toFixed(1)}`;
    return evaluation.toFixed(1);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-2 gap-2">
        {moves.map((move, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              onClick={() => onMoveClick(index)}
              className={`flex-1 px-2 py-1 text-left rounded font-medium ${
                index === currentMoveIndex
                  ? 'bg-blue-100 text-blue-900 font-semibold'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              {showMoveNumbers ? `${Math.floor(index / 2) + 1}.${index % 2 === 0 ? '' : '..'} ` : ''}{move.move}
            </button>
            {move.evaluation && (
              <span className="text-sm text-gray-800 font-medium">
                {formatEvaluation(move.evaluation)}
              </span>
            )}
            {move.comment && (
              <button
                onClick={() => setExpandedMove(expandedMove === index ? null : index)}
                className="text-gray-500 hover:text-gray-700"
              >
                💬
              </button>
            )}
          </div>
        ))}
      </div>
      {expandedMove !== null && moves[expandedMove].comment && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-800">
          {moves[expandedMove].comment}
        </div>
      )}
    </div>
  );
} 