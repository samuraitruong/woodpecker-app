import { Chess } from 'chess.js';

interface StockfishRequest {
  type: 'getBestMove' | 'evaluatePosition';
  fen: string;
  depth?: number;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

class Stockfish {
  private worker: Worker | null = null;
  private isReady = false;
  private requestQueue: StockfishRequest[] = [];
  private currentRequest: StockfishRequest | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker('/sf/stockfish-nnue-16.js');
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = (e) => console.error('Stockfish worker error:', e);
      this.init();
    }
  }

  private init() {
    if (!this.worker) return;
    this.worker.postMessage('uci');
    this.worker.postMessage('setoption name MultiPV value 1');
    this.worker.postMessage('setoption name Skill Level value 20');
  }

  private processNextRequest() {
    if (this.currentRequest || this.requestQueue.length === 0) return;
    this.currentRequest = this.requestQueue.shift()!;
    const { type, fen, depth } = this.currentRequest;
    if (!this.worker) return;
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth  ${depth ?? 20}`);
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
      // Ignore other messages
      return;
    }
    // Handle evaluatePosition
    if (type === 'evaluatePosition') {
      // Parse info line for evaluation and PV
      if (typeof message === 'string' && message.startsWith('info')) {
        // We'll collect the last info line at the requested depth
        this.lastInfoLine = message;
      }
      if (typeof message === 'string' && message.startsWith('bestmove')) {
        // Parse the last info line for score and PV
        let score = 0;
        let bestMove = '';
        let pv: string[] = [];
        if (this.lastInfoLine) {
          const scoreMatch = this.lastInfoLine.match(/score (cp|mate) (-?\d+)/);
          const pvMatch = this.lastInfoLine.match(/pv (.+)/);
          if (scoreMatch) {
            const [, type, value] = scoreMatch;
            score = type === 'cp' ? parseInt(value) / 100 : parseInt(value) * 1000;
          }
          if (pvMatch) {
            pv = pvMatch[1].split(' ');
            bestMove = pv[0];
          }
        }
        resolve({ score, bestMove, pv });
        this.lastInfoLine = undefined;
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
  }> {
    if (!this.worker || !this.isReady) {
      return { score: 0, bestMove: '', pv: [] };
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

  public async getBestMove(fen: string, timeLimit: number = 1000): Promise<string> {
    if (!this.worker || !this.isReady) {
      return '';
    }
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        type: 'getBestMove',
        fen,
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