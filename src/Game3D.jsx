// src/Game3D.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  generateWinPatterns,
  checkWinner,
  isBoardFull
} from './logic/boardUtils.js';
import { evaluateBoard, getAvailableMoves } from './logic/evaluation.js';
import { getBestMove } from './logic/ai.js';

// コンポーネント
import TwoDGrid from './components/TwoDGrid.jsx';
import ThreeDView from './components/ThreeDView.jsx';

const Game3D = () => {
  // 4x4x4 のボード
  const boardSize = 4;
  const initialBoard = Array(boardSize)
    .fill(null)
    .map(() =>
      Array(boardSize)
        .fill(null)
        .map(() => Array(boardSize).fill(null))
    );

  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(0);

  // 3D 操作用
  const [rotation, setRotation] = useState({ x: 20, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const containerRef = useRef(null);

  const [aiLastMove, setAiLastMove] = useState(null);

  // パターン事前生成
  const winPatterns = React.useMemo(() => generateWinPatterns(), []);

  // 中心オフセット
  const centerOffset = (boardSize - 1) / 2;

  /** 勝者判定 + 勝利セル特定 */
  const checkWinnerAndCells = (boardState) => {
    const candidate = checkWinner(boardState, winPatterns);
    if (!candidate) return null;

    // cellsを抽出
    for (const pattern of winPatterns) {
      const { cells } = pattern;
      const firstValue = boardState[cells[0][0]][cells[0][1]][cells[0][2]];
      if (
        firstValue &&
        cells.every(([z, x, y]) => boardState[z][x][y] === firstValue)
      ) {
        return { winner: firstValue, winningCells: cells };
      }
    }
    return null;
  };

  ///////////////////////////
  // イベントハンドラ
  ///////////////////////////
  const handleClick = (x, y) => {
    if (winner || currentPlayer !== 'X') return;
    if (board[selectedLayer][x][y]) return;

    const newBoard = JSON.parse(JSON.stringify(board));
    newBoard[selectedLayer][x][y] = 'X';

    const result = checkWinnerAndCells(newBoard);
    if (result) {
      setBoard(newBoard);
      setWinner(result.winner);
      setWinningCells(result.winningCells);
      return;
    }

    // AI ターン
    setBoard(newBoard);
    setCurrentPlayer('O');
    setAiLastMove(null);

    setTimeout(() => {
      handleAiMove(newBoard);
    }, 200);
  };

  const handleAiMove = (boardState) => {
    const depth = 3;
    const { move } = getBestMove(
      boardState,
      'O',
      depth,
      -100000,
      100000,
      winPatterns
    );

    if (!move) {
      // 空きなし or 負け確
      setCurrentPlayer('X');
      return;
    }

    const [z, x, y] = move;
    const newBoard = JSON.parse(JSON.stringify(boardState));
    newBoard[z][x][y] = 'O';
    setAiLastMove([z, x, y]);

    const result = checkWinnerAndCells(newBoard);
    if (result) {
      setBoard(newBoard);
      setWinner(result.winner);
      setWinningCells(result.winningCells);
    } else {
      setBoard(newBoard);
      setCurrentPlayer('X');
    }
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setWinner(null);
    setWinningCells([]);
    setSelectedLayer(0);
    setAiLastMove(null);
    setCurrentPlayer('X');
  };

  // 3D操作
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
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom]);
  

  ///////////////////////////
  // 補助関数: ハイライト判定
  ///////////////////////////
  const isCellInWinningPattern = (z, x, y) =>
    winningCells.some((c) => c[0] === z && c[1] === x && c[2] === y);

  const isAiLastMove = (z, x, y) => {
    if (!aiLastMove) return false;
    return z === aiLastMove[0] && x === aiLastMove[1] && y === aiLastMove[2];
  };

  /**
   * 2Dセルのクラス生成
   */
  const getCellClassName = (z, x, y) => {
    const value = board[z][x][y];
    const winning = isCellInWinningPattern(z, x, y);
    const aiMove = isAiLastMove(z, x, y);

    let highlightClass = '';
    if (winning) {
      highlightClass = 'animate-pulse ring-4 ring-yellow-400 scale-110';
    } else if (aiMove) {
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

  ///////////////////////////
  // 表示するメッセージ
  ///////////////////////////
  const renderTurnOrResult = () => {
    if (winner) {
      if (winner === 'X') {
        return <div className="text-3xl font-bold mb-4 text-red-400">You win! 🎉</div>;
      } else {
        return <div className="text-3xl font-bold mb-4 text-blue-400">You lose...</div>;
      }
    } else {
      if (currentPlayer === 'X') {
        return <div className="text-xl mb-4 text-blue-400">It's your turn</div>;
      } else {
        return <div className="text-xl mb-4 text-red-400">AI is thinking...</div>;
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-400">
        4x4x4 で 4 目並べ (AI対戦)
      </h1>

      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          {[0, 1, 2, 3].map((layer) => (
            <button
              key={layer}
              className={`px-4 py-2 rounded ${
                selectedLayer === layer
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedLayer(layer)}
            >
              Layer {layer + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 2D グリッド */}
      <TwoDGrid
        board={board}
        selectedLayer={selectedLayer}
        currentPlayer={currentPlayer}
        winner={winner}
        getCellClassName={getCellClassName}
        onCellClick={handleClick}
      />

      {/* 勝敗 or プレイヤーの状態 */}
      <div className="mb-8 text-center">{renderTurnOrResult()}</div>

      {/* 3D 表示 */}
      <ThreeDView
        board={board}
        containerRef={containerRef}
        rotation={rotation}
        zoom={zoom}
        handleMouseDown={handleMouseDown}
        centerOffset={centerOffset}
        isCellInWinningPattern={isCellInWinningPattern}
        isAiLastMove={isAiLastMove}
      />

      <button
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold transition-colors"
        onClick={resetGame}
      >
        New Game
      </button>
    </div>
  );
};

export default Game3D;
