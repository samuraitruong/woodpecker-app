import { useState, useEffect } from 'react';
import { Puzzle } from '../types';

interface PuzzlesResponse {
  puzzles: Puzzle[];
}

export function usePuzzles() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/puzzles.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: PuzzlesResponse = await response.json();
        setPuzzles(data.puzzles.slice(0, 2));
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch puzzles'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPuzzles();
  }, []);

  const getPuzzleById = (id: number) => {
    return puzzles.find(puzzle => puzzle.id === id);
  };

  const getNextPuzzle = (currentId: number) => {
    const currentIndex = puzzles.findIndex(puzzle => puzzle.id === currentId);
    return puzzles[currentIndex + 1];
  };

  const getPreviousPuzzle = (currentId: number) => {
    const currentIndex = puzzles.findIndex(puzzle => puzzle.id === currentId);
    return puzzles[currentIndex - 1];
  };

  return {
    puzzles,
    isLoading,
    error,
    getPuzzleById,
    getNextPuzzle,
    getPreviousPuzzle,
  };
} 