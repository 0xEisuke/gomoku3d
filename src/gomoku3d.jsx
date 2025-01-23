import React, { useState, useEffect, useRef } from 'react';

/**
 * 4x4x4の空間で、連続する4マス(=4目)をすべて洗い出す関数。
 */
const generateWinPatterns = () => {
  const size = 4; // 盤面サイズ
  const need = 4; // 4マス並びが勝利条件

  // 3次元空間で考えられる進行方向を定義 (13通り)
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

  // 盤面内の全てのセルを開始点として探索
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        // 各方向に need 個たどれるかチェック
        directions.forEach(([dx, dy, dz]) => {
          const cells = [];
          for (let i = 0; i < need; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            const nz = z + i * dz;

            // 範囲外になったらその方向は無効
            if (
              nx < 0 ||
              nx >= size ||
              ny < 0 ||
              ny >= size ||
              nz < 0 ||
              nz >= size
            ) {
              break;
            }
            cells.push([nz, nx, y]);
            cells[cells.length - 1][2] = ny; // こちらの書き方は補足
          }
          // need 個とれていれば有効パターン
          if (cells.length === need) {
            patterns.push({ cells });
          }
        });
      }
    }
  }
  return patterns;
};

////////////////////////////
// ミニマックス＆αβ法 用 AI
////////////////////////////

/** 勝者がいれば 'X' または 'O'、いなければ null */
const checkWinner = (boardState, winPatterns) => {
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
const isBoardFull = (boardState) => {
  for (let z = 0; z < boardState.length; z++) {
    for (let x = 0; x < boardState[z].length; x++) {
      for (let y = 0; y < boardState[z][x].length; y++) {
        if (!boardState[z][x][y]) {
          return false;
        }
      }
    }
  }
  return true;
};

/**
 * 評価関数 (board のスコアを返す)。
 * +∞ : X が勝利
 * -∞ : O が勝利
 * 途中盤面の場合、各 4マスパターンを見て:
 *  - X だけ => +1
 *  - O だけ => -1
 *  - 混在 => 0
 */
const evaluateBoard = (boardState, winPatterns) => {
    // まず、即勝利判定
    const winner = checkWinner(boardState, winPatterns);
    if (winner === 'X') return 10000;
    if (winner === 'O') return -10000;
  
    let score = 0;
    for (const pattern of winPatterns) {
      const cells = pattern.cells;
      let xCount = 0;
      let oCount = 0;
  
      for (const [z, x, y] of cells) {
        if (boardState[z][x][y] === 'X') xCount++;
        if (boardState[z][x][y] === 'O') oCount++;
      }
  
      // 両方いたら(混在したら)このラインは無意味→スコア0
      if (xCount > 0 && oCount > 0) {
        continue;
      }
  
      // Xのみ or Oのみのライン
      // リーチ(3個揃い+空き1)を最重要視
      if (xCount > 0) {
        switch (xCount) {
          case 3:
            score += 50; // リーチ
            break;
          case 2:
            score += 5;
            break;
          case 1:
            score += 1;
            break;
          default:
            // xCount=4 はすでに上で∞返しているので到達しない
            break;
        }
      } else if (oCount > 0) {
        switch (oCount) {
          case 3:
            score -= 50; // 相手のリーチ
            break;
          case 2:
            score -= 5;
            break;
          case 1:
            score -= 1;
            break;
          default:
            // oCount=4 も∞に到達しないはず
            break;
        }
      }
    }
    return score;
  };

/** board の空いているマスをすべて列挙 */
const getAvailableMoves = (boardState) => {
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

/**
 * ミニマックス + αβ 法
 * @param {Array} boardState - 盤面
 * @param {string} player - "X" or "O"
 * @param {number} depth - 残り探索深さ
 * @param {number} alpha
 * @param {number} beta
 * @param {Array} winPatterns - 4連続パターン一覧
 * @returns {{score: number, move: [z, x, y] | null}}
 */
const getBestMove = (boardState, player, depth, alpha, beta, winPatterns) => {
  const opponent = player === 'X' ? 'O' : 'X';
  const winner = checkWinner(boardState, winPatterns);

  // 終了判定 or depth=0
  if (winner || depth === 0 || isBoardFull(boardState)) {
    return {
      score: evaluateBoard(boardState, winPatterns),
      move: null,
    };
  }

  const availableMoves = getAvailableMoves(boardState);

  if (player === 'X') {
    // X (maximize)
    let bestScore = -100000;
    let bestMove = null;

    for (const [z, x, y] of availableMoves) {
      boardState[z][x][y] = 'X'; // 仮に置く
      const result = getBestMove(boardState, opponent, depth - 1, alpha, beta, winPatterns);
      boardState[z][x][y] = null; // 戻す

      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = [z, x, y];
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // βカット
    }

    return { score: bestScore, move: bestMove };
  } else {
    // O (minimize)
    let bestScore = 100000;
    let bestMove = null;

    for (const [z, x, y] of availableMoves) {
      boardState[z][x][y] = 'O';
      const result = getBestMove(boardState, opponent, depth - 1, alpha, beta, winPatterns);
      boardState[z][x][y] = null;

      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = [z, x, y];
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // αカット
    }

    return { score: bestScore, move: bestMove };
  }
};

//////////////////////////////////
// 4x4x4 4目並べ (AI対戦) コンポーネント
//////////////////////////////////
const Game3D = () => {
  // 4x4x4 の空ボードを初期化
  const boardSize = 4;
  const initialBoard = Array(boardSize)
    .fill(null)
    .map(() =>
      Array(boardSize)
        .fill(null)
        .map(() => Array(boardSize).fill(null))
    );

  // ステート
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState('X'); // 人間: X, AI: O
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(0);

  // 3D操作
  const [rotation, setRotation] = useState({ x: 20, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const containerRef = useRef(null);

  // **AIが最後に置いたマス**を記録
  const [aiLastMove, setAiLastMove] = useState(null);

  // 4連続パターン生成
  const winPatterns = React.useMemo(() => generateWinPatterns(), []);

  /**
   * 「4マス連続」を総当たりして勝者と勝利セルのリストを返す
   */
  const checkWinnerAndCells = (boardState) => {
    for (const pattern of winPatterns) {
      const { cells } = pattern;
      const firstValue = boardState[cells[0][0]][cells[0][1]][cells[0][2]];
      if (
        firstValue &&
        cells.every(([z, x, y]) => boardState[z][x][y] === firstValue)
      ) {
        return {
          winner: firstValue, // 'X' or 'O'
          winningCells: cells,
        };
      }
    }
    return null;
  };

  ///////////////////////////
  // 人間 (X) がセルをクリック
  ///////////////////////////
  const handleClick = (x, y) => {
    // すでに勝敗がついている、もしくは相手ターンなら無視
    if (winner || currentPlayer !== 'X') return;

    // 空いてないなら無視
    if (board[selectedLevel][x][y]) return;

    // X を置く
    const newBoard = JSON.parse(JSON.stringify(board));
    newBoard[selectedLevel][x][y] = 'X';

    // 勝敗チェック
    const result = checkWinnerAndCells(newBoard);
    if (result) {
      setBoard(newBoard);
      setWinner(result.winner);
      setWinningCells(result.winningCells);
      return;
    }

    // 勝ちなし → 次は AI(O) ターン
    setBoard(newBoard);
    setCurrentPlayer('O');
    setAiLastMove(null); // いったんクリア

    // AI の着手を少し遅らせて UI更新
    setTimeout(() => {
      handleAiMove(newBoard);
    }, 200);
  };

  ///////////////////////////
  // AI (O) の着手
  ///////////////////////////
  const handleAiMove = (boardState) => {
    // ミニマックス / αβ探索 depth=3
    const depth = 3;
    const { move } = getBestMove(
      boardState,
      'O', 
      depth,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      winPatterns
    );

    // 空き無い or 失敗
    if (!move) {
      setCurrentPlayer('X');
      return;
    }

    const [z, x, y] = move;
    const newBoard = JSON.parse(JSON.stringify(boardState));
    newBoard[z][x][y] = 'O';

    // AIが最後に置いたマスを保存 (黄緑色で表示する用)
    setAiLastMove([z, x, y]);

    // 勝敗チェック
    const result = checkWinnerAndCells(newBoard);
    if (result) {
      setBoard(newBoard);
      setWinner(result.winner);
      setWinningCells(result.winningCells);
    } else {
      // 次ターンは X
      setBoard(newBoard);
      setCurrentPlayer('X');
    }
  };

  ///////////////////////////
  // New Game リセット
  ///////////////////////////
  const resetGame = () => {
    setBoard(initialBoard);
    setWinner(null);
    setWinningCells([]);
    setSelectedLevel(0);
    setAiLastMove(null);
    setCurrentPlayer('X');
  };

  ///////////////////////////
  // 3D 操作 (回転・ズーム)
  ///////////////////////////
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rotation.y,
      y: e.clientY - rotation.x,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newRotationY = e.clientX - dragStart.x;
    const newRotationX = e.clientY - dragStart.y;
    setRotation({
      x: Math.min(Math.max(newRotationX, -60), 60),
      y: newRotationY % 360,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, dragStart]);

  const handleWheel = (e) => {
    e.preventDefault();
    const newZoom = Math.min(Math.max(zoom - e.deltaY * 0.001, 0.5), 2);
    setZoom(newZoom);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel);
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoom]);

  ///////////////////////////
  // 勝利セルやAIの最終手ハイライト
  ///////////////////////////
  const isCellInWinningPattern = (z, x, y) =>
    winningCells.some((c) => c[0] === z && c[1] === x && c[2] === y);

  const isAiLastMove = (z, x, y) => {
    if (!aiLastMove) return false;
    return z === aiLastMove[0] && x === aiLastMove[1] && y === aiLastMove[2];
  };

  /**
   * 2D表示のセルに適用するクラス
   */
  const getCellClassName = (z, x, y) => {
    const value = board[z][x][y];
    const isWinning = isCellInWinningPattern(z, x, y);
    const isAiMove = isAiLastMove(z, x, y);

    // 勝ちセルハイライトを最優先（黄色リング）
    // 次にAIの最終手（黄緑リング）
    let highlightClass = '';
    if (isWinning) {
      highlightClass = 'animate-pulse ring-4 ring-yellow-400 scale-110';
    } else if (isAiMove) {
      highlightClass = 'ring-4 ring-lime-400';
    }

    return `
      w-16 h-16 text-2xl font-bold flex items-center justify-center rounded
      ${value ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}
      ${value === 'X' ? 'text-blue-400' : 'text-red-400'}
      ${highlightClass}
      transform transition-all duration-300
    `;
  };

  // 中心を (1.5,1.5,1.5) とする
  const centerOffset = (boardSize - 1) / 2; // = 1.5

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-400">
        4x4x4 で 4 目並べ (AI対戦)
      </h1>

      {/* レベル(=z次元)切り替えボタン */}
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          {[0, 1, 2, 3].map((level) => (
            <button
              key={level}
              className={`px-4 py-2 rounded ${
                selectedLevel === level
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedLevel(level)}
            >
              Level {level + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 2D 表示 */}
      <div className="relative perspective-1000 mb-12">
        <div className="grid grid-cols-4 gap-2 transform rotate-x-45 rotate-z-45">
          {board[selectedLevel].map((row, x) =>
            row.map((cell, y) => (
              <button
                key={`${x}-${y}`}
                className={getCellClassName(selectedLevel, x, y)}
                onClick={() => handleClick(x, y)}
                disabled={winner || cell || currentPlayer !== 'X'}
              >
                {cell}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 勝利 or 現在のプレイヤー 表示: 2D と 3D の間に配置 */}
      <div className="mb-8 text-center">
        {winner ? (
          <div className="text-2xl font-bold mb-4">
            Player{' '}
            <span className={winner === 'X' ? 'text-blue-400' : 'text-red-400'}>
              {winner}
            </span>{' '}
            wins! 🎉
          </div>
        ) : (
          <div className="text-xl mb-4">
            Current Player:{' '}
            <span className={currentPlayer === 'X' ? 'text-blue-400' : 'text-red-400'}>
              {currentPlayer}
            </span>
          </div>
        )}
      </div>

      {/* 3D ビュー */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">
          3D View
        </h2>
        <div
          ref={containerRef}
          className="relative bg-gray-800 rounded-lg overflow-hidden cursor-move"
          style={{
            width: '600px',
            height: '600px',
            perspective: '1200px',
            perspectiveOrigin: 'center',
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `
                translate(-50%, -50%)
                scale(${zoom})
                rotateX(${rotation.x}deg)
                rotateY(${rotation.y}deg)
              `,
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center',
              width: '0px',
              height: '0px',
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {board.map((level, z) =>
              level.map((row, x) =>
                row.map((cell, y) => {
                  const isWinning = isCellInWinningPattern(z, x, y);
                  const isAiMove = isAiLastMove(z, x, y);

                  // 枠線を黄色 or 黄緑 or 白に
                  let borderClass = 'border-white';
                  if (isWinning) {
                    borderClass = 'border-yellow-400 animate-pulse';
                  } else if (isAiMove) {
                    borderClass = 'border-lime-400';
                  }

                  return (
                    <div
                      key={`${z}-${x}-${y}`}
                      className={`absolute border transform-gpu ${borderClass}`}
                      style={{
                        width: '50px',
                        height: '50px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        transform: `
                          translate3d(
                            ${(x - centerOffset) * 60}px,
                            ${(y - centerOffset) * 60}px,
                            ${(z - centerOffset) * 60}px
                          )
                        `,
                      }}
                    >
                      {cell && (
                        <div
                          className={`w-6 h-6 rounded-full ${
                            isWinning ? 'animate-ping' : ''
                          }`}
                          style={{
                            backgroundColor:
                              cell === 'X'
                                ? isWinning
                                  ? '#3b82f6'
                                  : '#60a5fa'
                                : isWinning
                                ? '#ef4444'
                                : '#f87171',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: `0 4px 6px ${
                              cell === 'X' ? '#3b82f6aa' : '#ef4444aa'
                            }`,
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
        <p className="text-center text-gray-400 mt-2">
          ドラッグして回転、ホイールでズーム操作
        </p>
      </div>

        {/* リセットボタン */}
        <div className="text-center">
            <button
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold transition-colors"
                onClick={resetGame}
            >
                New Game
            </button>
        </div>
    </div>
  );
};

export default Game3D;
