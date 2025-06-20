interface AnalysisLine {
  moves: string[];
  evaluation: number;
  mate?: number | null;
  display?: string;
}

interface AnalysisLinesProps {
  lines: AnalysisLine[];
  analyzedFen?: string;
}

export default function AnalysisLines({ lines, analyzedFen }: AnalysisLinesProps) {
  const formatEvaluation = (line: AnalysisLine) => {
    if (line.display) return line.display;
    if (typeof line.mate === 'number' && line.mate !== null) {
      return line.mate > 0 ? `M${line.mate}` : `-M${Math.abs(line.mate)}`;
    }
    if (line.evaluation > 0) return `+${line.evaluation.toFixed(1)}`;
    return line.evaluation.toFixed(1);
  };

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-3 mt-2">
      <div className="text-sm font-semibold text-gray-800 mb-2">Stockfish Analysis</div>
      {analyzedFen && (
        <div className="text-xs text-gray-600 mb-2 font-mono break-all">
          FEN: {analyzedFen}
        </div>
      )}
      <div className="space-y-1">
        {lines.map((line, index) => (
          <div key={index} className="text-sm font-mono">
            <span className="font-bold text-gray-900">
              {formatEvaluation(line)}
            </span>
            <span className="text-gray-700 ml-2">
              {line.moves.slice(0, 12).join(' ')}
              {line.moves.length > 12 && ' ...'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 