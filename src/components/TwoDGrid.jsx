// src/components/TwoDGrid.jsx
import React from 'react';

const TwoDGrid = ({
  board,
  selectedLayer,
  currentPlayer,
  winner,
  getCellClassName,
  onCellClick,
}) => {
  return (
    <div className="relative perspective-1000 mb-12">
      <div className="grid grid-cols-4 gap-2 transform rotate-x-45 rotate-z-45">
        {board[selectedLayer].map((row, x) =>
          row.map((cell, y) => (
            <button
              key={`${x}-${y}`}
              className={getCellClassName(selectedLayer, x, y)}
              onClick={() => onCellClick(x, y)}
              disabled={winner || cell || currentPlayer !== 'X'}
            >
              {cell}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default TwoDGrid;
