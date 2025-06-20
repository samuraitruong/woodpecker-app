import { Chess } from 'chess.js';

interface StockfishRequest {
  type: 'getBestMove' | 'evaluatePosition' | 'analyzeMultipleLines';
  fen: string;
  depth?: number;
  numLines?: number;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

class Stockfish {
  private worker: Worker | null = null;
  private isReady = false;
  private requestQueue: StockfishRequest[] = [];
  private currentRequest: StockfishRequest | null = null;
  private lastInfoLines: string[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker('/sf17/stockfish-17.js');
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = (e) => console.error('Stockfish worker error:', e);
      this.init();
    }
  }

  private init() {
    if (!this.worker) return;
    this.worker.postMessage('uci');
    this.worker.postMessage('setoption name MultiPV value 4');
    this.worker.postMessage('setoption name Skill Level value 20');
  }

  private processNextRequest() {
    if (this.currentRequest || this.requestQueue.length === 0) return;
    this.currentRequest = this.requestQueue.shift()!;
    const { type, fen, depth, numLines } = this.currentRequest;
    if (!this.worker) return;
    this.worker.postMessage(`position fen ${fen}`);
    if (type === 'analyzeMultipleLines') {
      this.worker.postMessage(`setoption name MultiPV value ${numLines || 4}`);
      this.worker.postMessage(`go depth ${depth ?? 22}`);
    } else {
      this.worker.postMessage(`setoption name MultiPV value 1`);
      this.worker.postMessage(`go depth ${depth ?? 22}`);
    }
  }

  private convertUciToSan(uciMoves: string[], fen: string): string[] {
    try {
      const game = new Chess(fen);
      const sanMoves: string[] = [];
      
      for (const uciMove of uciMoves) {
        // Filter out non-UCI moves (should be exactly 4 characters)
        if (uciMove && uciMove.length === 4) {
          const from = uciMove.substring(0, 2);
          const to = uciMove.substring(2, 4);
          
          // Validate that from and to are valid chess squares
          if (this.isValidSquare(from) && this.isValidSquare(to)) {
            const moveObj = game.move({ from, to, promotion: 'q' });
            if (moveObj) {
              sanMoves.push(moveObj.san);
            }
          }
        }
      }
      
      return sanMoves;
    } catch (error) {
      console.error('Error converting UCI to SAN:', error, 'UCI moves:', uciMoves);
      return []; // Return empty array if conversion fails
    }
  }

  private isValidSquare(square: string): boolean {
    const file = square.charAt(0);
    const rank = square.charAt(1);
    return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
  }

  private handleMessage(event: MessageEvent) {
    const message = event.data;
    // Ready check
    if (message === 'uciok') {
      this.isReady = true;
      return;
    }
    if (!this.currentRequest) return;
    const { type, resolve } = this.currentRequest;
    
    // Handle getBestMove
    if (type === 'getBestMove') {
      if (typeof message === 'string' && message.startsWith('bestmove')) {
        const move = message.split(' ')[1];
        resolve(move);
        this.currentRequest = null;
        this.processNextRequest();
      }
      return;
    }
    
    // Handle evaluatePosition
    if (type === 'evaluatePosition') {
      if (typeof message === 'string' && message.startsWith('info')) {
        this.lastInfoLine = message;
      }
      if (typeof message === 'string' && message.startsWith('bestmove')) {
        let score = 0;
        let bestMove = '';
        let pv: string[] = [];
        let mate: number | null = null;
        if (this.lastInfoLine) {
          const scoreMatch = this.lastInfoLine.match(/score (cp|mate) (-?\d+)/);
          const pvMatch = this.lastInfoLine.match(/pv (.+)/);
          if (scoreMatch) {
            const [, type, value] = scoreMatch;
            if (type === 'cp') {
              score = parseInt(value) / 100;
              mate = null;
            } else if (type === 'mate') {
              // Use a very large value for mate, preserving sign
              const sign = parseInt(value) > 0 ? 1 : -1;
              score = sign * 10000;
              mate = parseInt(value);
            }
          }
          if (pvMatch) {
            pv = pvMatch[1].split(' ');
            bestMove = pv[0];
          }
        }
        resolve({ score, bestMove, pv, mate });
        this.lastInfoLine = undefined;
        this.currentRequest = null;
        this.processNextRequest();
      }
      return;
    }
    
    // Handle analyzeMultipleLines
    if (type === 'analyzeMultipleLines') {
      if (typeof message === 'string' && message.startsWith('info') && message.includes('multipv')) {
        this.lastInfoLines.push(message);
      }
      if (typeof message === 'string' && message.startsWith('bestmove')) {
        const lines: { moves: string[]; evaluation: number; mate: number | null; display: string }[] = [];
        
        // Get the original FEN for conversion
        const originalFen = this.currentRequest?.fen || '';
        
        // Parse all collected info lines
        for (const infoLine of this.lastInfoLines) {
          const multipvMatch = infoLine.match(/multipv (\d+)/);
          const scoreMatch = infoLine.match(/score (cp|mate) (-?\d+)/);
          const pvMatch = infoLine.match(/pv (.+)/);
          
          if (multipvMatch && scoreMatch && pvMatch) {
            const pvIndex = parseInt(multipvMatch[1]) - 1;
            const [, scoreType, scoreValue] = scoreMatch;
            const uciMoves = pvMatch[1].split(' ');
            let score;
            let mate: number | null = null;
            let display = '';
            if (scoreType === 'cp') {
              score = parseInt(scoreValue) / 100;
              mate = null;
              display = (score > 0 ? '+' : '') + score.toFixed(1);
            } else if (scoreType === 'mate') {
              const sign = parseInt(scoreValue) > 0 ? 1 : -1;
              score = sign * 10000;
              mate = parseInt(scoreValue);
              display = mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
            } else {
              score = 0;
              mate = null;
              display = '0.0';
            }
            // Convert UCI moves to SAN
            const sanMoves = this.convertUciToSan(uciMoves, originalFen);
            lines[pvIndex] = { moves: sanMoves, evaluation: score, mate, display };
          }
        }
        // Sort by evaluation (best first)
        lines.sort((a, b) => b.evaluation - a.evaluation);
        resolve(lines);
        this.lastInfoLines = [];
        this.currentRequest = null;
        this.processNextRequest();
      }
      return;
    }
  }

  private lastInfoLine?: string;

  public async evaluatePosition(fen: string, depth: number = 20): Promise<{
    score: number;
    bestMove: string;
    pv: string[];
    mate: number | null;
  }> {
    if (!this.worker || !this.isReady) {
      return { score: 0, bestMove: '', pv: [], mate: null };
    }
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        type: 'evaluatePosition',
        fen,
        depth,
        resolve,
        reject,
      });
      this.processNextRequest();
    });
  }

  public async getBestMove(fen: string, depth: number = 20): Promise<string> {
    if (!this.worker || !this.isReady) {
      return '';
    }
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        type: 'getBestMove',
        depth,
        fen,
        resolve,
        reject,
      });
      this.processNextRequest();
    });
  }

  public async analyzeMultipleLines(fen: string, depth: number = 15, numLines: number = 4): Promise<{
    moves: string[];
    evaluation: number;
    mate: number | null;
    display: string;
  }[]> {
    if (!this.worker || !this.isReady) {
      return [];
    }
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        type: 'analyzeMultipleLines',
        fen,
        depth,
        numLines,
        resolve,
        reject,
      });
      this.processNextRequest();
    });
  }

  public stop() {
    if (this.worker) {
      this.worker.postMessage('stop');
    }
  }

  public quit() {
    if (this.worker) {
      this.worker.postMessage('quit');
      this.worker = null;
    }
  }
}

export const stockfish = new Stockfish(); 