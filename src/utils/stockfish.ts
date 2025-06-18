import { Chess } from 'chess.js';

class Stockfish {
  private worker: Worker | null = null;
  private isReady = false;
  private onMessageCallback: ((data: any) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker('/stockfish.js');
      this.worker.onmessage = this.handleMessage.bind(this);
      this.init();
    }
  }

  private init() {
    if (!this.worker) return;
    this.worker.postMessage('uci');
    this.worker.postMessage('setoption name MultiPV value 1');
    this.worker.postMessage('setoption name Skill Level value 20');
  }

  private handleMessage(event: MessageEvent) {
    const message = event.data;
    if (message === 'uciok') {
      this.isReady = true;
    }
    if (this.onMessageCallback) {
      this.onMessageCallback(message);
    }
  }

  public async evaluatePosition(fen: string, depth: number = 20): Promise<{
    score: number;
    bestMove: string;
    pv: string[];
  }> {
    return new Promise((resolve) => {
      if (!this.worker || !this.isReady) {
        resolve({ score: 0, bestMove: '', pv: [] });
        return;
      }

      let score = 0;
      let bestMove = '';
      let pv: string[] = [];

      this.onMessageCallback = (message: string) => {
        if (message.startsWith('info depth ' + depth)) {
          const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
          const pvMatch = message.match(/pv (.+)/);
          
          if (scoreMatch) {
            const [, type, value] = scoreMatch;
            score = type === 'cp' ? parseInt(value) / 100 : parseInt(value) * 1000;
          }
          
          if (pvMatch) {
            pv = pvMatch[1].split(' ');
            bestMove = pv[0];
          }

          if (message.includes('bestmove')) {
            this.onMessageCallback = null;
            resolve({ score, bestMove, pv });
          }
        }
      };

      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${depth}`);
    });
  }

  public async getBestMove(fen: string, timeLimit: number = 1000): Promise<string> {
    return new Promise((resolve) => {
      if (!this.worker || !this.isReady) {
        resolve('');
        return;
      }

      this.onMessageCallback = (message: string) => {
        if (message.startsWith('bestmove')) {
          const move = message.split(' ')[1];
          this.onMessageCallback = null;
          resolve(move);
        }
      };

      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go movetime ${timeLimit}`);
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