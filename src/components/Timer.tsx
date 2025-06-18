import { useState, useEffect, useCallback } from 'react';

interface TimerProps {
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export default function Timer({ initialTime = 0, onTimeUpdate, className = '' }: TimerProps) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          onTimeUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      remainingSeconds.toString().padStart(2, '0'),
    ];

    return parts.join(':');
  }, []);

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="font-mono text-2xl font-bold bg-gray-800 text-white px-4 py-2 rounded-lg">
        {formatTime(time)}
      </div>
      <button
        onClick={toggleTimer}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isRunning
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isRunning ? 'Stop' : 'Start'}
      </button>
    </div>
  );
} 