import React, { useEffect, useState } from 'react';
import { stockfish } from '../utils/stockfish';
import { Chess } from 'chess.js';

interface PositionStrengthMeterProps {
  fen: string;
  maxValue?: number;
}

export default function PositionStrengthMeter({ fen, maxValue = 5 }: PositionStrengthMeterProps) {
  const [evaluation, setEvaluation] = useState(0);
  const [mate, setMate] = useState<number | null>(null);
  const [color, setColor] = useState("");
  useEffect(() => {
    let isMounted = true;
    async function fetchEvaluation() {
      const result = await stockfish.evaluatePosition(fen);
      const game = new Chess(fen);
      setColor(game.turn());
      if (isMounted) {
        setEvaluation(result.score);
        setMate(result.mate ?? null);
      }
    }
    fetchEvaluation();
    return () => { isMounted = false; };
  }, [fen]);

  // UI bar capping logic
  let cappedEval = evaluation;
  if (mate !== null) {
    cappedEval = mate > 0 ? maxValue : -maxValue;
  } else if (evaluation > maxValue) {
    cappedEval = maxValue - 0.05;
  } else if (evaluation < -maxValue) {
    cappedEval = -maxValue + 0.05;
  }

  const advantage = (cappedEval / maxValue) * 50;
  let whiteHeight = 50;
  let blackHeight = 50;
  if (color === "w") {
    whiteHeight = 50 + advantage;
    blackHeight = 100 - whiteHeight;
  }
  if(color === 'b'){
    blackHeight = 50 + advantage;
    whiteHeight = 100 - blackHeight;
  }
  // Don't show number if evaluation is 0.0
  const showNumber = Math.abs(evaluation) > 0.01 || mate !== null;
  const isWhiteAdvantage = color ==='w';

  let displayValue = '';
  if (mate !== null) {
    displayValue = mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
  } else {
    displayValue = (evaluation > 0 ? '+' : '') + evaluation.toFixed(1);
  }

  return (
    <div className="flex flex-col h-full pt-[6px] pb-[6px]">
      <div className="text-sm font-medium text-gray-700 mb-2">+{maxValue}</div>
      <div className="relative w-8 flex-1 bg-gray-200">
        {/* Black bar (top) */}
        <div
          className="absolute top-0 w-full transition-all duration-300"
          style={{
            height: `${blackHeight}%`,
            background: 'linear-gradient(to bottom, #374151, #1f2937)'
          }}
        />
        {/* White bar (bottom) */}
        <div
          className="absolute bottom-0 w-full transition-all duration-300"
          style={{
            height: `${whiteHeight}%`,
            background: 'linear-gradient(to top, #f3f4f6, #e5e7eb)'
          }}
        />
        {showNumber && (
          <div
            className="absolute left-0 right-0 text-center text-xs font-bold"
            style={{
              top: isWhiteAdvantage ? 'auto' : '10px',
              bottom: isWhiteAdvantage ? '10px' : 'auto',
              color: isWhiteAdvantage ? '#000' : '#fff',
              textShadow: '1px 1px 1px rgba(0,0,0,0.4)'
            }}
          >
            {displayValue}
          </div>
        )}
      </div>
      <div className="text-sm font-medium text-gray-700 mt-2">-{maxValue}</div>
    </div>
  );
} 