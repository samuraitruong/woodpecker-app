import { useState, useEffect, useCallback } from 'react';

interface TimerProps {
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  className?: string;
  isRunning?: boolean;
}

export default function Timer({ initialTime = 0, onTimeUpdate, className = '', isRunning = false }: TimerProps) {
  const [time, setTime] = useState(initialTime);

  // Reset timer when initialTime changes
  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

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

  return (
    <div className={`font-mono text-2xl font-bold bg-gray-800 text-white px-4 py-2 rounded-lg ${className}`}>
      {formatTime(time)}
    </div>
  );
} 