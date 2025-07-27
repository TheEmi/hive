const HiveBoard = (props, context) => {
  const { getState, setState } = context;
  const spacing = 0.95; // 1 = normal, >1 = more space, <1 = tighter

  // Initialize game state
  const initializeGame = () => {
    if (!getState('gameInitialized', false)) {
      setState('currentPlayer', 'white');
      setState('selectedHex', null);
      setState('selectedPieceInventory', null);
      setState('hoveredHex', null);
      setState('boardPieces', {}); // q,r -> {type, color}
      setState('moveHistory', []);
      setState('canConfirm', false);
      setState('canUndo', false);
      setState('validMoves', []);
      setState('gameInitialized', true);
    }
  };

  // Initialize game on first render
  initializeGame();

  // Game logic functions
  const getNeighbors = (q, r) => [
    { q: q + 1, r: r },
    { q: q + 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 }
  ];

  const pieceKey = (q, r) => `${q},${r}`;

  const isPieceAt = (q, r) => {
    const boardPieces = getState('boardPieces', {});
    return !!boardPieces[pieceKey(q, r)];
  };

  const getPieceAt = (q, r) => {
    const boardPieces = getState('boardPieces', {});
    return boardPieces[pieceKey(q, r)] || null;
  };

  const isValidPlacement = (q, r, currentPlayer) => {
    const boardPieces = getState('boardPieces', {});
    const moveHistory = getState('moveHistory', []);
    
    // Can't place on occupied hex
    if (isPieceAt(q, r)) return false;
    
    // First move can be anywhere
    if (moveHistory.length === 0) return true;
    
    // Second move must be adjacent to first
    if (moveHistory.length === 1) {
      const neighbors = getNeighbors(q, r);
      return neighbors.some(neighbor => isPieceAt(neighbor.q, neighbor.r));
    }
    
    // After first two moves, must be adjacent to own pieces only
    const neighbors = getNeighbors(q, r);
    let hasOwnNeighbor = false;
    let hasOpponentNeighbor = false;
    
    neighbors.forEach(neighbor => {
      const piece = getPieceAt(neighbor.q, neighbor.r);
      if (piece) {
        if (piece.color === currentPlayer) {
          hasOwnNeighbor = true;
        } else {
          hasOpponentNeighbor = true;
        }
      }
    });
    
    return hasOwnNeighbor && !hasOpponentNeighbor;
  };

  const calculateValidMoves = () => {
    const selectedPiece = getState('selectedPieceInventory', null);
    const currentPlayer = getState('currentPlayer', 'white');
    const boardPieces = getState('boardPieces', {});
    
    if (!selectedPiece) {
      setState('validMoves', []);
      return;
    }
    
    const validMoves = [];
    
    // Generate potential placement positions around existing pieces
    const occupiedPositions = Object.keys(boardPieces);
    const potentialPositions = new Set();
    
    if (occupiedPositions.length === 0) {
      // First move - center position
      potentialPositions.add('0,0');
    } else {
      // Add all neighbors of existing pieces
      occupiedPositions.forEach(pos => {
        const [q, r] = pos.split(',').map(Number);
        const neighbors = getNeighbors(q, r);
        neighbors.forEach(neighbor => {
          potentialPositions.add(pieceKey(neighbor.q, neighbor.r));
        });
      });
    }
    
    // Check each potential position
    potentialPositions.forEach(pos => {
      const [q, r] = pos.split(',').map(Number);
      if (isValidPlacement(q, r, currentPlayer)) {
        validMoves.push({ q, r });
      }
    });
    
    setState('validMoves', validMoves);
  };

  // const handleHexClick = (q, r) => {
  //   const selectedPiece = getState('selectedPieceInventory', null);
  //   const currentPlayer = getState('currentPlayer', 'white');
  //   const validMoves = getState('validMoves', []);
    
  //   if (selectedPiece) {
  //     // Check if this is a valid move
  //     const isValidMove = validMoves.some(move => move.q === q && move.r === r);
  //     if (isValidMove) {
  //       setState('selectedHex', { q, r });
  //       setState('canConfirm', true);
  //     }
  //   } else {
  //     // Select existing piece for movement (future feature)
  //     const piece = getPieceAt(q, r);
  //     if (piece && piece.color === currentPlayer) {
  //       setState('selectedHex', { q, r });
  //     }
  //   }
  // };

  // Hexagonal grid math
  const hexToPixel = (q, r, size) => {
    const x = size * ((3 / 2) * q) * spacing;
    const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r) * spacing;
    return { x, y };
  };

  // Touch/mouse handling for pan and zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoom = getState("zoom", 1);
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newZoom = Math.max(0.3, Math.min(3, zoom + delta));
    setState("zoom", newZoom);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Single touch - start pan
      setState("lastTouch", {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        isPanning: true,
      });
    } else if (e.touches.length === 2) {
      // Two finger - start pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setState("lastTouch", {
        distance,
        isPinching: true,
        zoom: getState("zoom", 1),
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const lastTouch = getState("lastTouch", {});

    if (e.touches.length === 1 && lastTouch.isPanning) {
      // Pan
      const deltaX = e.touches[0].clientX - lastTouch.x;
      const deltaY = e.touches[0].clientY - lastTouch.y;
      const panX = getState("panX", 0) + deltaX;
      const panY = getState("panY", 0) + deltaY;
      setState("panX", panX);
      setState("panY", panY);
      setState("lastTouch", {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        isPanning: true,
      });
    } else if (e.touches.length === 2 && lastTouch.isPinching) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const scale = distance / lastTouch.distance;
      const newZoom = Math.max(0.3, Math.min(3, lastTouch.zoom * scale));
      setState("zoom", newZoom);
    }
  };

  const handleTouchEnd = () => {
    setState("lastTouch", {});
  };

  // Mouse handling for desktop
  const handleMouseDown = (e) => {
    setState("lastMouse", {
      x: e.clientX,
      y: e.clientY,
      isDragging: true,
    });
  };

  const handleMouseMove = (e) => {
    const lastMouse = getState("lastMouse", {});
    if (lastMouse.isDragging) {
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;
      const panX = getState("panX", 0) + deltaX;
      const panY = getState("panY", 0) + deltaY;
      setState("panX", panX);
      setState("panY", panY);
      setState("lastMouse", {
        x: e.clientX,
        y: e.clientY,
        isDragging: true,
      });
    }
  };

  const handleMouseUp = () => {
    setState("lastMouse", {});
  };

  const handleHexClick = (q, r) => {
    const selected = getState("selectedHex", null);
    if (selected && selected.q === q && selected.r === r) {
      setState("selectedHex", {q: null, r: null});
    } else {
      setState("selectedHex", { q, r });
    }
  };

  // Sample board data - create a larger hexagonal grid
  const createBoardData = () => {
    const hexagons = [];
    const radius = 6; // Board radius

    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) {
        // Add some sample pieces
        let hex = { q, r, pieceType: null };

        // Center piece
        if (q === 0 && r === 0) {
          hex = { q, r, pieceType: "queen", pieceColor: "white" };
        }
        // Some surrounding pieces
        else if ((q === 1 && r === 0) || (q === -1 && r === 1)) {
          hex = { q, r, pieceType: "beetle", pieceColor: "black" };
        } else if ((q === 0 && r === 1) || (q === 1 && r === -1)) {
          hex = { q, r, pieceType: "spider", pieceColor: "white" };
        } else if ((q === -1 && r === 0) || (q === 0 && r === -1)) {
          hex = { q, r, pieceType: "ant", pieceColor: "black" };
        }
        // Available moves
        else if (Math.abs(q) + Math.abs(r) + Math.abs(-q - r) === 4) {
          hex = { q, r, pieceType: null, isAvailable: true };
        }
        // Capturable pieces
        else if ((q === 2 && r === 0) || (q === -2 && r === 1)) {
          hex = {
            q,
            r,
            pieceType: "grasshopper",
            pieceColor: "white",
            isCapturable: true,
          };
        }

        hexagons.push(hex);
      }
    }
    return hexagons;
  };

  const boardData = createBoardData();
  setState("boardData", boardData);
  const hexSize = 50;

  return {
    render: () => ({
      div: {
        className:
          "w-full h-screen bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden relative",
        children: [
          // Board container
          {
            div: {
              className: "w-full h-full relative select-none",
              style: "touch-action: none;",
              onwheel: handleWheel,
              ontouchstart: handleTouchStart,
              ontouchmove: handleTouchMove,
              ontouchend: handleTouchEnd,
              onmousedown: handleMouseDown,
              onmousemove: handleMouseMove,
              onmouseup: handleMouseUp,
              onmouseleave: handleMouseUp,
              children: [
                {
                  div: {
                    className: "absolute",
                    style: () => ({
                      transform: `translate(50vw, 50vh) translate(${getState(
                        "panX",
                        0
                      )}px, ${getState("panY", 0)}px) scale(${getState(
                        "zoom",
                        1
                      )})`,
                      "transform-origin": "0 0",
                    }),
                    children: () =>
                      getState("boardData", []).map((hex) => {
                        const { x, y } = hexToPixel(hex.q, hex.r, hexSize);

                        return {
                          div: {
                            style: () => ({
                              left: `${x - hexSize}px`,
                              top: `${y - hexSize}px`,
                              pointerEvents: "none",
                            }),
                            className: "absolute",
                            children: [
                              {
                                HiveHexagon: {
                                  q: hex.q,
                                  r: hex.r,
                                  pieceType: hex.pieceType,
                                  pieceColor: hex.pieceColor,
                                  isSelected: getState("selectedHex", { r: null, q: null }).r === hex.r &&
                                              getState("selectedHex", { r: null, q: null }).q === hex.q,
                                  isAvailable: hex.isAvailable || false,
                                  isCapturable: hex.isCapturable || false,
                                  onClick: () => handleHexClick(hex.q, hex.r),
                                  size: hexSize,
                                },
                              },
                            ],
                          },
                        };
                      }),
                  },
                },
              ],
            },
          },
        ],
      },
    }),
  };
};
export default HiveBoard;
