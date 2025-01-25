// src/logic/evaluation.js

import { checkWinner } from './boardUtils.js';

/**
 * 評価関数 (board のスコアを返す)。
 * +10000 : X が勝利
 * -10000 : O が勝利
 * 途中盤面の場合、各 4マスパターンを見て:
 *  - X だけ => +1, +5, +50
 *  - O だけ => -1, -5, -50
 *  - 混在 => 0
 */
export const evaluateBoard = (boardState, winPatterns) => {
  const winner = checkWinner(boardState, winPatterns);
  if (winner === 'X') return 10000;
  if (winner === 'O') return -10000;

  let score = 0;
  for (const pattern of winPatterns) {
    const { cells } = pattern;
    let xCount = 0;
    let oCount = 0;

    for (const [z, x, y] of cells) {
      if (boardState[z][x][y] === 'X') xCount++;
      if (boardState[z][x][y] === 'O') oCount++;
    }

    // 混在ラインは0点
    if (xCount > 0 && oCount > 0) continue;

    // X のみ or O のみ
    if (xCount > 0) {
      switch (xCount) {
        case 3:
          score += 50;
          break;
        case 2:
          score += 5;
          break;
        case 1:
          score += 1;
          break;
        default:
          break;
      }
    } else if (oCount > 0) {
      switch (oCount) {
        case 3:
          score -= 50;
          break;
        case 2:
          score -= 5;
          break;
        case 1:
          score -= 1;
          break;
        default:
          break;
      }
    }
  }
  return score;
};

/** board の空いているマスをすべて列挙 */
export const getAvailableMoves = (boardState) => {
  const moves = [];
  const sizeZ = boardState.length;
  const sizeX = boardState[0].length;
  const sizeY = boardState[0][0].length;

  for (let z = 0; z < sizeZ; z++) {
    for (let x = 0; x < sizeX; x++) {
      for (let y = 0; y < sizeY; y++) {
        if (!boardState[z][x][y]) {
          moves.push([z, x, y]);
        }
      }
    }
  }
  return moves;
};
