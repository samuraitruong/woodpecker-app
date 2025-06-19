interface PositionStrengthMeterProps {
  evaluation: number;
  maxValue?: number;
}

export default function PositionStrengthMeter({ evaluation, maxValue = 5 }: PositionStrengthMeterProps) {
  // Normalize the evaluation value to be between -maxValue and maxValue
  const normalizedEval = Math.max(Math.min(evaluation, maxValue), -maxValue);
  
  // Calculate the percentage for the visual meter (50% is neutral)
  const percentage = ((normalizedEval + maxValue) / (2 * maxValue)) * 100;

  return (
    <div className="h-[600px]">
      <div className="text-sm font-medium text-gray-700 mb-2">+{maxValue}</div>
      <div className="relative w-8 h-[500px] bg-gray-200">
        <div
          className="absolute top-0 w-full transition-all duration-300"
          style={{
            height: `${percentage}%`,
            background: 'linear-gradient(to bottom, #374151, #1f2937)'
          }}
        />
        <div
          className="absolute bottom-0 w-full transition-all duration-300"
          style={{
            height: `${100 - percentage}%`,
            background: 'linear-gradient(to top, #f3f4f6, #e5e7eb)'
          }}
        />
      </div>
      <div className="text-sm font-medium text-gray-700 mt-2">-{maxValue}</div>
      <div className="text-sm font-medium text-gray-700 mt-2">
        {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
      </div>
    </div>
  );
} 