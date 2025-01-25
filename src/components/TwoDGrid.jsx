// src/components/TwoDGrid.jsx
import React from 'react';

const TwoDGrid = ({
  board,
  selectedLayer,
  currentPlayer,
  winner,
  getCellClassName,
  onCellClick,
  threatCells = [], // デフォルト値を設定
}) => {
  // リーチマスかどうかを判定
  const isThreatCell = (z, x, y) =>
    threatCells.some(([tz, tx, ty]) => tz === z && tx === x && ty === y);

  return (
    <div className="relative perspective-1000 mb-12">
      <div className="grid grid-cols-4 gap-2 transform rotate-x-45 rotate-z-45">
        {board[selectedLayer].map((row, x) =>
          row.map((cell, y) => {
            const isThreat = isThreatCell(selectedLayer, x, y);
            const extraClass = isThreat ? 'ring-4 ring-red-400 animate-pulse' : '';

            return (
              <button
                key={`${x}-${y}`}
                className={`${getCellClassName(selectedLayer, x, y)} ${extraClass}`}
                onClick={() => onCellClick(x, y)}
                disabled={winner || cell || currentPlayer !== 'X'}
              >
                {cell}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TwoDGrid;
