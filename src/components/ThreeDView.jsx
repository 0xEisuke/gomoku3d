// src/components/ThreeDView.jsx
import React from 'react';

const ThreeDView = ({
  board,
  containerRef,
  rotation,
  zoom,
  handleMouseDown,
  centerOffset,
  isCellInWinningPattern,
  isAiLastMove,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-400">3D View</h2>
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
            transition: 'transform 0.3s ease-out',
          }}
        >
          {board.map((layer, z) =>
            layer.map((row, x) =>
              row.map((cell, y) => {
                const winning = isCellInWinningPattern(z, x, y);
                const aiMove = isAiLastMove(z, x, y);

                let borderClass = 'border-white';
                if (winning) borderClass = 'border-yellow-400 animate-pulse';
                else if (aiMove) borderClass = 'border-lime-400';

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
                          winning ? 'animate-ping' : ''
                        }`}
                        style={{
                          backgroundColor:
                            cell === 'X'
                              ? winning
                                ? '#3b82f6'
                                : '#60a5fa'
                              : winning
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
  );
};

export default ThreeDView;
