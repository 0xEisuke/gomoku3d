// src/logic/boardUtils.js

/**
 * 4x4x4の空間で、連続する4マス(=4目)をすべて洗い出す関数。
 */
export const generateWinPatterns = () => {
    const size = 4;
    const need = 4;
    // 方向定義
    const directions = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
      [1, -1, 0],
      [1, 0, 1],
      [1, 0, -1],
      [0, 1, 1],
      [0, 1, -1],
      [1, 1, 1],
      [1, 1, -1],
      [1, -1, 1],
      [1, -1, -1],
    ];
  
    const patterns = [];
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          directions.forEach(([dx, dy, dz]) => {
            const cells = [];
            for (let i = 0; i < need; i++) {
              const nx = x + i * dx;
              const ny = y + i * dy;
              const nz = z + i * dz;
              if (
                nx < 0 || nx >= size ||
                ny < 0 || ny >= size ||
                nz < 0 || nz >= size
              ) {
                break;
              }
              cells.push([nz, nx, ny]);
            }
            if (cells.length === need) {
              patterns.push({ cells });
            }
          });
        }
      }
    }
    return patterns;
  };
  
  /** 勝者がいれば 'X' or 'O'、なければ null */
  export const checkWinner = (boardState, winPatterns) => {
    for (const pattern of winPatterns) {
      const { cells } = pattern;
      const firstValue = boardState[cells[0][0]][cells[0][1]][cells[0][2]];
      if (
        firstValue &&
        cells.every(([z, x, y]) => boardState[z][x][y] === firstValue)
      ) {
        return firstValue; // "X" or "O"
      }
    }
    return null;
  };
  
  /** ボードが全て埋まっていれば true */
  export const isBoardFull = (boardState) => {
    for (let z = 0; z < boardState.length; z++) {
      for (let x = 0; x < boardState[z].length; x++) {
        for (let y = 0; y < boardState[z][x].length; y++) {
          if (!boardState[z][x][y]) return false;
        }
      }
    }
    return true;
  };

  // リーチ判定: 指定されたプレイヤーがリーチを作るセルを特定する
  export const findThreats = (boardState, winPatterns, player) => {
    const opponent = player === 'X' ? 'O' : 'X';
    const threats = [];

    winPatterns.forEach(({ cells }) => {
      let countPlayer = 0;
      let countEmpty = 0;
      let emptyCell = null;

      cells.forEach(([z, x, y]) => {
        if (boardState[z][x][y] === player) countPlayer++;
        if (!boardState[z][x][y]) {
          countEmpty++;
          emptyCell = [z, x, y];
        }
      });

      // リーチ条件: プレイヤーの駒が3つ & 空きが1つ
      if (countPlayer === 3 && countEmpty === 1) {
        threats.push(emptyCell); // 空きマスを追加
      }
    });

    return threats;
  };

  