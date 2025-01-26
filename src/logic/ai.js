// src/logic/ai.js
import { checkWinner, isBoardFull } from './boardUtils.js';
import { evaluateBoard, getAvailableMoves } from './evaluation.js';

/**
 * ミニマックス + αβ 法で最善手を返す
 */
export const getBestMove = (boardState, player, depth, alpha, beta, winPatterns) => {
  const opponent = player === 'X' ? 'O' : 'X';
  const winner = checkWinner(boardState, winPatterns);

  // 終端判定
  if (winner || depth === 0 || isBoardFull(boardState)) {
    return {
      score: evaluateBoard(boardState, winPatterns),
      move: null,
    };
  }

  const moves = getAvailableMoves(boardState);

  if (player === 'X') {
    // maximize
    let bestScore = -100000;
    let bestMove = null;

    for (const [z, x, y] of moves) {
      boardState[z][x][y] = 'X';

      // 勝利が確定する場合は即座にその手を選択
      if (checkWinner(boardState, winPatterns) === 'X') {
        boardState[z][x][y] = null;
        return { score: 10000, move: [z, x, y] };
      }
      
      const result = getBestMove(boardState, opponent, depth - 1, alpha, beta, winPatterns);
      boardState[z][x][y] = null;

      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = [z, x, y];
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    return { score: bestScore, move: bestMove };
  } else {
    // minimize
    let bestScore = 100000;
    let bestMove = null;

    for (const [z, x, y] of moves) {
      boardState[z][x][y] = 'O';

      // 勝利が確定する場合は即座にその手を選択
      if (checkWinner(boardState, winPatterns) === 'O') {
        boardState[z][x][y] = null;
        return { score: -10000, move: [z, x, y] };
      }

      const result = getBestMove(boardState, opponent, depth - 1, alpha, beta, winPatterns);
      boardState[z][x][y] = null;

      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = [z, x, y];
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break;
    }
    return { score: bestScore, move: bestMove };
  }
};
