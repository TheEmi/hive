const HiveBoardOnline = (props, context) => {
  const { getState, setState, subscribe, juris } = context;
  const spacing = 0.95; // 1 = normal, >1 = more space, <1 = tighter

  // WebSocket connection - use existing connection if available
  let ws = getState("ws", null);

  // Initialize WebSocket connection only if not already connected
  const initWebSocket = () => {
    // Always get the latest WebSocket from global state (managed by online-menu)
    const existingWs = getState("ws", null);
    
    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
      ws = existingWs;
      setState("connectionStatus", "connected");
      const currentWs = getState("ws", null);
    const playerId = getState("playerId", null);
    
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      currentWs.send(JSON.stringify({
        type: 'requestUpdate',
      }));
    }
      // Subscribe to board-specific state changes instead of overriding message handler
      // The online-menu will handle all WebSocket messages and update global state
      // We'll react to those state changes
      return;
    }
    

    console.log('No existing connection found, this should not happen in online mode');
    setState("connectionStatus", "disconnected");
  };

  // Handle board-specific updates when game state changes
  const handleGameStateUpdate = () => {
    const showToast = getState("showToast", null);
    const playerColor = getState("playerColor", null);
    const currentPlayer = getState("currentPlayer", "white");
    const isMyTurn = currentPlayer === playerColor;    
    if (showToast) {
      if (isMyTurn) {
        showToast("Your turn!");
      } else {
        showToast("Opponent's turn");
      }
    }
    
    // Update visual board
    syncGameStateFromGlobal();
  };

  // Send move to server
  const sendMoveToServer = (gameState) => {
    // Always get the latest WebSocket from global state
    const currentWs = getState("ws", null);
    const playerId = getState("playerId", null);
    
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      currentWs.send(JSON.stringify({
        type: 'move',
        boardPieces: gameState.boardPieces,
        stackedPieces: gameState.stackedPieces,
        moveHistory: gameState.moveHistory,
        gameWon: gameState.gameWon,
        gameWinner: gameState.gameWinner,
        currentPlayer: gameState.currentPlayer
      }));
    } else {
      
      // Try to get a fresh connection
      const ws = getState("ws", null);
      if (ws) {
        console.log('Trying with fresh WebSocket reference, state:', ws.readyState);
      }
    }
  };

  // Sync game state from server
  const syncGameState = (serverGameState) => {
    if(!getState("currentPlayerLock", false)){
      setState("currentPlayer", serverGameState.currentPlayer);
    }
    
    const wasGameWon = getState("gameWon", false);
    if(!getState("boardPiecesLock", false)){
    setState("boardPieces", serverGameState.boardPieces);
    }
    setState("stackedPieces", serverGameState.stackedPieces);
    setState("moveHistory", serverGameState.moveHistory);
    setState("gameWon", serverGameState.gameWon);
    setState("gameWinner", serverGameState.gameWinner);
    
    // If game just ended (wasn't won before but is now), show popup
    if (!wasGameWon && serverGameState.gameWon && serverGameState.gameWinner) {
      setTimeout(() => {
        setState("showRestartPopup", true);
      }, 2000);
    }
    
    recalculatePieceInventories(serverGameState.moveHistory);
    // Update visual board
    const boardData = getState("boardData", []);
    const updatedBoardData = boardData.map((hex) => {
      const key = pieceKey(hex.q, hex.r);
      const piece = serverGameState.boardPieces[key];
      
      if (piece) {
        return {
          ...hex,
          pieceType: piece.type,
          pieceColor: piece.color
        };
      } else {
        return {
          ...hex,
          pieceType: null,
          pieceColor: "transparent"
        };
      }
    });
    
    setState("boardData", updatedBoardData);
    
    // Show whose turn it is
    const playerColor = getState("playerColor", null);
    const isMyTurn = serverGameState.currentPlayer === playerColor;
  };
  

  // Recalculate piece inventories based on move history
  const recalculatePieceInventories = (moveHistory) => {
    // Reset piece counts to initial values
    let initialPiecesWhite = {
      queen: 1,
      beetle: 2,
      grasshopper: 3,
      spider: 2,
      ant: 3
    };
    let initialPiecesBlack = {
      queen: 1,
      beetle: 2,
      grasshopper: 3,
      spider: 2,
      ant: 3
    };
    
    
    // Subtract pieces that have been placed based on move history
    moveHistory.forEach(move => {
      if (move.piece !== "movement") { // Only count placement moves, not movement
        if (move.player === "white") {
          initialPiecesWhite[move.piece] -= 1;
        } else {
          initialPiecesBlack[move.piece] -= 1;
        }
      }
    });

    setState("whitePieces", initialPiecesWhite);
    setState("blackPieces", initialPiecesBlack);
    
  };

  // Room management functions are handled in OnlineMenu component
  // Just ensure we're using the existing WebSocket connection
  const ensureConnection = () => {
    const currentWs = getState("ws", null);
    if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
      setState("connectionStatus", "disconnected");
    } else {
      // Make sure we're using the existing connection
      ws = currentWs;
      setState("connectionStatus", "connected");
      initWebSocket(); // This will just attach our message handler
    }
  };

  // Initialize game state
  const initializeGame = () => {
    if (!getState("gameInitialized", false)) {
      setState("currentPlayer", "white");
      setState("selectedHex", { q: null, r: null });
      setState("selectedPieceInventory", null);
      setState("boardPieces", {}); // Add this - was missing!
      setState("stackedPieces", {}); // q,r -> [{type, color}, ...]
      setState("moveHistory", []);
      setState("canConfirm", false);
      setState("canUndo", false);
      setState("validMoves", []);
      setState("selectedPieceForMovement", null);
      setState("movementMode", false);
      setState("gameMode", "online"); // Ensure game mode is set to online
      setState("gameInitialized", true);
    }
  };

  // Initialize game on first render
  initializeGame();
  
  // Ensure WebSocket connection
  ensureConnection();

  // Cleanup animation frames on component unmount
  const cleanup = () => {
    // Close WebSocket connection
    setState("shouldReconnect", false);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };

  // Add cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
  }

  const unsubscribe = subscribe(
    "selectedPieceInventory",
    (newValue, oldValue, path) => {
      if (newValue) {
        calculateValidMoves();
      } else {
        const boardPieces = getState("boardData", []);
        const newBoardPieces = boardPieces.map((hex) => {
          return { ...hex, isAvailable: false };
        });
        setState("boardData", newBoardPieces);
      }
    }
  );

  // Subscribe to game state changes from server (via online-menu)
  const unsubscribeGameState = subscribe(
    "currentPlayer",
    (newValue, oldValue, path) => {
      if (newValue && newValue !== oldValue) {
        // Handle board-specific updates when game state changes
        setState("currentPlayerLock", true);
        handleGameStateUpdate();
        setState("currentPlayerLock", false);
      }
    }
  );

  // Subscribe to board pieces changes to update visual board
  const unsubscribeBoardPieces = subscribe(
    "boardPieces",
    (newValue, oldValue, path) => {
      if (newValue !== oldValue) {
        setState("boardPiecesLock", true);
        syncGameStateFromGlobal();
        setState("boardPiecesLock", false);
      }
    }
  );

  // Function to sync game state from global state (updated by online-menu)
  const syncGameStateFromGlobal = () => {
    const serverGameState = {
      currentPlayer: getState("currentPlayer", "white"),
      boardPieces: getState("boardPieces", {}),
      stackedPieces: getState("stackedPieces", {}),
      moveHistory: getState("moveHistory", []),
      gameWon: getState("gameWon", false),
      gameWinner: getState("gameWinner", null)
    };
    
    syncGameState(serverGameState);
  };

  //Subscribe to menu piece selection

  // Game logic functions
  const getNeighbors = (q, r) => [
    { q: q + 1, r: r },
    { q: q + 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 },
  ];

  const pieceKey = (q, r) => `${q},${r}`;

  const isPieceAt = (q, r) => {
    const boardPieces = getState("boardPieces", {});
    return !!boardPieces[pieceKey(q, r)];
  };

  const getPieceAt = (q, r) => {
    const boardPieces = getState("boardPieces", {});
    return boardPieces[pieceKey(q, r)] || null;
  };

  const getStackAt = (q, r) => {
    const stackedPieces = getState("stackedPieces", {});
    return stackedPieces[pieceKey(q, r)] || [];
  };

  const getTopPieceAt = (q, r) => {
    const stack = getStackAt(q, r);
    return stack.length > 0 ? stack[stack.length - 1] : null;
  };

  // Check if Queen placement is required - FIXED
  const isQueenPlacementRequired = (currentPlayer) => {
    const moveHistory = getState("moveHistory", []);
    // Count placement moves only (not movement moves)
    const playerPlacementMoves = moveHistory.filter(
      (move) => move.player === currentPlayer && move.piece !== "movement"
    );
    const hasQueen = playerPlacementMoves.some(
      (move) => move.piece === "queen"
    );
    // Must place queen by 4th piece (index 3), so check if >= 3 pieces placed without queen
    return playerPlacementMoves.length >= 3 && !hasQueen;
  };

  // Check if hive connectivity is maintained
  const isHiveConnected = (excludeQ, excludeR) => {
    const boardPieces = getState("boardPieces", {});
    const pieces = Object.keys(boardPieces)
      .filter((key) => {
        const [q, r] = key.split(",").map(Number);
        return !(q === excludeQ && r === excludeR);
      })
      .map((key) => {
        const [q, r] = key.split(",").map(Number);
        return { q, r };
      });

    if (pieces.length === 0) return true;

    // BFS to check connectivity
    const visited = new Set();
    const queue = [pieces[0]];
    visited.add(pieceKey(pieces[0].q, pieces[0].r));

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = getNeighbors(current.q, current.r);

      neighbors.forEach((neighbor) => {
        const key = pieceKey(neighbor.q, neighbor.r);
        if (
          !visited.has(key) &&
          pieces.some((p) => p.q === neighbor.q && p.r === neighbor.r)
        ) {
          visited.add(key);
          queue.push(neighbor);
        }
      });
    }

    return visited.size === pieces.length;
  };

  const isValidPlacement = (q, r, currentPlayer) => {
    const boardPieces = getState("boardPieces", {});
    const moveHistory = getState("moveHistory", []);

    // Can't place on occupied hex (unless beetle can stack)
    if (isPieceAt(q, r)) return false;
    // First move can be anywhere
    if (moveHistory.length === 0) return true;

    // Second move must be adjacent to first
    if (moveHistory.length === 1) {
      const neighbors = getNeighbors(q, r);
      return neighbors.some((neighbor) => isPieceAt(neighbor.q, neighbor.r));
    }

    // After first two moves, must be adjacent to own pieces only
    const neighbors = getNeighbors(q, r);
    let hasOwnNeighbor = false;
    let hasOpponentNeighbor = false;

    neighbors.forEach((neighbor) => {
      const topPiece = getTopPieceAt(neighbor.q, neighbor.r);
      if (topPiece) {
        if (topPiece.color === currentPlayer) {
          hasOwnNeighbor = true;
        } else {
          hasOpponentNeighbor = true;
        }
      }
    });

    return hasOwnNeighbor && !hasOpponentNeighbor;
  };

  // Movement validation for different pieces
  const canPieceMoveTo = (fromQ, fromR, toQ, toR, pieceType) => {
    if (fromQ === toQ && fromR === toR) return false;

    const piece = getTopPieceAt(fromQ, fromR);
    if (!piece) return false;

    // Check if hive stays connected when piece is moved
    if (!isHiveConnected(fromQ, fromR)) return false;

    switch (pieceType) {
      case "queen":
        return isQueenMove(fromQ, fromR, toQ, toR);
      case "beetle":
        return isBeetleMove(fromQ, fromR, toQ, toR);
      case "grasshopper":
        return isGrasshopperMove(fromQ, fromR, toQ, toR);
      case "spider":
        return isSpiderMove(fromQ, fromR, toQ, toR);
      case "ant":
        return isAntMove(fromQ, fromR, toQ, toR);
      default:
        return false;
    }
  };

  // Helper function to check if a piece can slide to a position
  const canSlideToPosition = (currentQ, currentR, targetQ, targetR) => {
    // Must be adjacent
    const neighbors = getNeighbors(currentQ, currentR);
    if (!neighbors.some((n) => n.q === targetQ && n.r === targetR)) {
      return false;
    }

    // Target must be empty
    if (isPieceAt(targetQ, targetR)) {
      return false;
    }

    // Must maintain contact with at least one piece while sliding
    // Check that we can slide from current to target without breaking the sliding rule
    const targetNeighbors = getNeighbors(targetQ, targetR);
    const hasAdjacentPiece = targetNeighbors.some((neighbor) => {
      // Don't count the position we're moving from
      if (neighbor.q === currentQ && neighbor.r === currentR) {
        return false;
      }
      return isPieceAt(neighbor.q, neighbor.r);
    });

    return hasAdjacentPiece;
  };

  const isQueenMove = (fromQ, fromR, toQ, toR) => {
    const neighbors = getNeighbors(fromQ, fromR);
    // Must be adjacent and destination must be empty
    if (!neighbors.some((n) => n.q === toQ && n.r === toR) || isPieceAt(toQ, toR)) {
      return false;
    }
    
    // Check if queen can slide to the destination (freedom of movement rule)
    return canSlideToPosition(fromQ, fromR, toQ, toR);
  };

  const isBeetleMove = (fromQ, fromR, toQ, toR) => {
    const neighbors = getNeighbors(fromQ, fromR);
    return neighbors.some((n) => n.q === toQ && n.r === toR);
  };

  const isGrasshopperMove = (fromQ, fromR, toQ, toR) => {
    const directions = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ];

    for (let dir of directions) {
      let currentQ = fromQ + dir.q;
      let currentR = fromR + dir.r;
      let jumpedOverPiece = false;

      // Check if there's at least one piece to jump over in this direction
      if (!isPieceAt(currentQ, currentR)) {
        continue; // No piece to jump over in this direction
      }

      // Jump over consecutive pieces
      while (isPieceAt(currentQ, currentR)) {
        jumpedOverPiece = true;
        currentQ += dir.q;
        currentR += dir.r;
      }

      // If we jumped over at least one piece and landed on the target empty space
      if (jumpedOverPiece && currentQ === toQ && currentR === toR) {
        return true;
      }
    }
    return false;
  };

  const isSpiderMove = (fromQ, fromR, toQ, toR) => {
    // Spider moves exactly 3 spaces around the hive
    return findPathOfLength(fromQ, fromR, toQ, toR, 3);
  };

  const isAntMove = (fromQ, fromR, toQ, toR) => {
    // Ant can move any number of spaces around the hive
    return findPath(fromQ, fromR, toQ, toR);
  };

  const findPath = (fromQ, fromR, toQ, toR) => {
    // Check if the destination is reachable by sliding around the hive
    const canSlideToPosition = (currentQ, currentR, targetQ, targetR) => {
      // Must be adjacent
      const neighbors = getNeighbors(currentQ, currentR);
      if (!neighbors.some((n) => n.q === targetQ && n.r === targetR)) {
        return false;
      }

      // Target must be empty (unless it's the original position we're moving from)
      if (
        isPieceAt(targetQ, targetR) &&
        !(targetQ === fromQ && targetR === fromR)
      ) {
        return false;
      }

      // Must maintain contact with at least one piece while sliding
      // Check that we can slide from current to target without breaking the sliding rule
      const targetNeighbors = getNeighbors(targetQ, targetR);
      const hasAdjacentPiece = targetNeighbors.some((neighbor) => {
        // Don't count the position we're moving from or the current position
        if (
          (neighbor.q === fromQ && neighbor.r === fromR) ||
          (neighbor.q === currentQ && neighbor.r === currentR)
        ) {
          return false;
        }
        return isPieceAt(neighbor.q, neighbor.r);
      });

      return hasAdjacentPiece;
    };

    const visited = new Set();
    const queue = [{ q: fromQ, r: fromR }];
    visited.add(pieceKey(fromQ, fromR));

    while (queue.length > 0) {
      const { q, r } = queue.shift();

      if (q === toQ && r === toR) return true;

      const neighbors = getNeighbors(q, r);
      neighbors.forEach((neighbor) => {
        const key = pieceKey(neighbor.q, neighbor.r);
        if (
          !visited.has(key) &&
          canSlideToPosition(q, r, neighbor.q, neighbor.r)
        ) {
          visited.add(key);
          queue.push({ q: neighbor.q, r: neighbor.r });
        }
      });
    }
    return false;
  };

  const findPathOfLength = (fromQ, fromR, toQ, toR, exactLength) => {
    const canSlideToPosition = (currentQ, currentR, targetQ, targetR) => {
      // Must be adjacent
      const neighbors = getNeighbors(currentQ, currentR);
      if (!neighbors.some((n) => n.q === targetQ && n.r === targetR)) {
        return false;
      }

      // Target must be empty (unless it's the original position we're moving from)
      if (
        isPieceAt(targetQ, targetR) &&
        !(targetQ === fromQ && targetR === fromR)
      ) {
        return false;
      }

      // Must maintain contact with at least one piece while sliding
      const targetNeighbors = getNeighbors(targetQ, targetR);
      const hasAdjacentPiece = targetNeighbors.some((neighbor) => {
        // Don't count the position we're moving from or the current position
        if (
          (neighbor.q === fromQ && neighbor.r === fromR) ||
          (neighbor.q === currentQ && neighbor.r === currentR)
        ) {
          return false;
        }
        return isPieceAt(neighbor.q, neighbor.r);
      });

      return hasAdjacentPiece;
    };

    const findPaths = (q, r, target, remainingSteps, visited) => {
      if (remainingSteps === 0) return q === target.q && r === target.r;
      
      const neighbors = getNeighbors(q, r);

      for (let neighbor of neighbors) {
        const neighborKey = pieceKey(neighbor.q, neighbor.r);
        
        // Skip if this neighbor is already visited
        if (visited.has(neighborKey)) continue;
        
        if (canSlideToPosition(q, r, neighbor.q, neighbor.r)) {
          const newVisited = new Set(visited);
          newVisited.add(neighborKey); // Mark this position as visited
          
          if (
            findPaths(
              neighbor.q,
              neighbor.r,
              target,
              remainingSteps - 1,
              newVisited
            )
          ) {
            return true;
          }
        }
      }
      return false;
    };

    // Start with the starting position already marked as visited
    const initialVisited = new Set();
    initialVisited.add(pieceKey(fromQ, fromR));
    return findPaths(fromQ, fromR, { q: toQ, r: toR }, exactLength, initialVisited);
  };

  const calculateValidMoves = () => {
    const selectedPiece = getState("selectedPieceInventory", null);
    const currentPlayer = getState("currentPlayer", "white");
    const boardPieces = getState("boardData", []);
    const movementMode = getState("movementMode", false);
    const selectedPieceForMovement = getState("selectedPieceForMovement", null);

    if (!selectedPiece && !movementMode) {
      return;
    }

    const validMoves = [];

    if (movementMode && selectedPieceForMovement) {
      // Calculate valid moves for piece movement
      boardPieces.forEach((hex) => {
        if (
          canPieceMoveTo(
            selectedPieceForMovement.q,
            selectedPieceForMovement.r,
            hex.q,
            hex.r,
            selectedPieceForMovement.type
          )
        ) {
          validMoves.push({ q: hex.q, r: hex.r });
        }
      });
    } else if (selectedPiece) {
      // Check Queen placement requirement - FIXED
      if (
        isQueenPlacementRequired(currentPlayer) &&
        selectedPiece !== "queen"
      ) {
        const showToast = getState("showToast", null);
        if (showToast) {
          showToast("Queen placement required! Cannot place other pieces.");
        }
        setState(
          "boardData",
          boardPieces.map((hex) => ({ ...hex, isAvailable: false }))
        );
        return;
      }

      // Generate potential placement positions around existing pieces
      const occupiedPositions = boardPieces.filter((hex) => hex.pieceType);
      const potentialPositions = new Set();

      if (occupiedPositions.length === 0) {
        // First move - center position
        potentialPositions.add("0,0");
      } else {
        // Add all neighbors of existing pieces
        occupiedPositions.forEach((pos) => {
          const { q, r } = pos;
          const neighbors = getNeighbors(q, r);
          neighbors.forEach((neighbor) => {
            potentialPositions.add(pieceKey(neighbor.q, neighbor.r));
          });
        });
      }
      // Check each potential position
      potentialPositions.forEach((pos) => {
        const [q, r] = pos.split(",").map(Number);
        let canPlace = isValidPlacement(q, r, currentPlayer);
        // Note: Beetles can only stack during movement, not initial placement
        
        if (canPlace) {
          validMoves.push({ q, r });
        }
      });
    }

    // Fix the mapping logic
    const newBoardPieces = boardPieces.map((hex) => {
      const { q, r } = hex;
      const isAvailable = validMoves.some(
        (move) => move.q === q && move.r === r
      );
      return { ...hex, isAvailable };
    });
    setState("boardData", newBoardPieces);
    setState("validMoves", validMoves);
  };
  setState("calculateValidMoves", calculateValidMoves);

  const handleHexClick = (q, r) => {
    if(getState("gameWon", false)) return; // Ignore clicks if game is already won
    
    // Check if it's this player's turn
    const currentPlayer = getState("currentPlayer", "white");
    const playerColor = getState("playerColor", null);
    if (currentPlayer !== playerColor) {
      const showToast = getState("showToast", null);
      if (showToast) {
        showToast("Wait for your turn!");
      }
      return;
    }
    
    // Check if game has started
    if (!getState("gameStarted", false)) {
      const showToast = getState("showToast", null);
      if (showToast) {
        showToast("Waiting for opponent to join...");
      }
      return;
    }

    const selectedPiece = getState("selectedPieceInventory", null);
    const validMoves = getState("validMoves", []);
    const movementMode = getState("movementMode", false);
    const selectedPieceForMovement = getState("selectedPieceForMovement", null);
    if (movementMode && selectedPieceForMovement) {
      // Handle piece movement
      const isValidMove = validMoves.some(
        (move) => move.q === q && move.r === r
      );
      if (isValidMove) {
        // Store original position for undo
        setState("lastMoveFrom", {
          q: selectedPieceForMovement.q,
          r: selectedPieceForMovement.r,
        });
        setState("lastMoveTo", { q, r });
        setState("lastMoveType", "movement");

        movePiece(selectedPieceForMovement.q, selectedPieceForMovement.r, q, r);
        setState("movementMode", false);
        setState("selectedPieceForMovement", null);
        setState("selectedHex", { q, r });
        setState("canConfirm", true);
        setState("canUndo", true);

        // Clear available moves after movement
        setState(
          "boardData",
          getState("boardData", []).map((hex) => ({
            ...hex,
            isAvailable: false,
          }))
        );
      } else {
        // Click on invalid move location or different piece - clear movement mode
        setState("movementMode", false);
        setState("selectedPieceForMovement", null);
        setState("validMoves", []);
        setState(
          "boardData",
          getState("boardData", []).map((hex) => ({
            ...hex,
            isAvailable: false,
          }))
        );
        
        // If clicked on another piece of same player, select it for movement
        const topPiece = getTopPieceAt(q, r);
        if (topPiece && topPiece.color === currentPlayer) {
          // Recursively call to select the new piece
          handleHexClick(q, r);
        }
      }
    } else if (selectedPiece) {
      // Handle piece placement
      const isValidMove = validMoves.some(
        (move) => move.q === q && move.r === r
      );
      if (isValidMove) {
        // Check if there's already a pending move that needs to be confirmed
        const canConfirm = getState("canConfirm", false);
        if (canConfirm) {
          const showToast = getState("showToast", null);
          if (showToast) {
            showToast("Please confirm or undo the current move first!");
          }
          return;
        }
        
        // Store placement info for undo
        setState("lastMoveType", "placement");
        setState("lastPlacedPiece", {
          q,
          r,
          type: selectedPiece,
          color: currentPlayer,
        });

        placePiece(q, r, selectedPiece, currentPlayer);
        setState("selectedHex", { q, r });
        setState("canConfirm", true);
        setState("canUndo", true);

        // Clear available moves after placement
        setState(
          "boardData",
          getState("boardData", []).map((hex) => ({
            ...hex,
            isAvailable: false,
          }))
        );
      } else {
        // Invalid placement - do nothing, don't allow clicking on unavailable hexes
        const showToast = getState("showToast", null);
        if (showToast) {
          showToast("Piece can only be placed on highlighted hexes");
        }
      }
    } else {
      // Select existing piece for movement - FIXED
      const topPiece = getTopPieceAt(q, r);
      if (topPiece && topPiece.color === currentPlayer) {
        // Additional check: make sure it's actually the player's turn
        const playerColor = getState("playerColor", null);
        if (currentPlayer !== playerColor) {
          const showToast = getState("showToast", null);
          if (showToast) {
            showToast("Wait for your turn!");
          }
          return;
        }
        
        // Check if game has started
        if (!getState("gameStarted", false)) {
          const showToast = getState("showToast", null);
          if (showToast) {
            showToast("Waiting for opponent to join...");
          }
          return;
        }
        
        // Check if player has placed their queen - can't move pieces until queen is placed
        const hasQueen = getState(`${currentPlayer}Pieces.queen`, 1, false) < 1;
        if (!hasQueen) {
          const showToast = getState("showToast", null);
          if (showToast) {
            showToast(`Cannot move pieces - ${currentPlayer} must place Queen first!`);
          }
          return;
        }
        
        // Check if there's a pending move that needs to be confirmed
        const canConfirm = getState("canConfirm", false);
        const lastMoveType = getState("lastMoveType", null);
        if (canConfirm && lastMoveType === "movement") {
          const showToast = getState("showToast", null);
          if (showToast) {
            showToast("Please confirm or undo the current move first!");
          }
          return;
        }
        
        // Clear any previous selections
        setState("selectedPieceInventory", null);
        setState("selectedHex", { q: null, r: null });

        // Set movement mode
        setState("selectedPieceForMovement", {
          q,
          r,
          type: topPiece.type,
          color: topPiece.color,
        });
        setState("movementMode", true);
        
        // Calculate valid moves and check if piece can actually move
        const boardPieces = getState("boardData", []);
        const validMoves = [];
        
        boardPieces.forEach((hex) => {
          if (canPieceMoveTo(q, r, hex.q, hex.r, topPiece.type)) {
            validMoves.push({ q: hex.q, r: hex.r });
          }
        });
        
        // If no valid moves, clear the selection immediately
        if (validMoves.length === 0) {
          setState("movementMode", false);
          setState("selectedPieceForMovement", null);
          setState("validMoves", []);
          const showToast = getState("showToast", null);
          if (showToast) {
            
            showToast(`This ${topPiece.type} cannot move from this position`);
          }
          return;
        }
        
        // Update board with valid moves
        const newBoardPieces = boardPieces.map((hex) => {
          const isAvailable = validMoves.some(
            (move) => move.q === hex.q && move.r === hex.r
          );
          return { ...hex, isAvailable };
        });
        setState("boardData", newBoardPieces);
        setState("validMoves", validMoves);
      }
    }
  };

  const placePiece = (q, r, pieceType, color) => {
    const boardPieces = getState("boardPieces", {});
    const stackedPieces = getState("stackedPieces", {});
    const key = pieceKey(q, r);

    // Normal placement - beetles can only stack during movement, not placement
    setState("boardPieces", {
      ...boardPieces,
      [key]: { type: pieceType, color, height: 1 },
    });
    setState("stackedPieces", {
      ...stackedPieces,
      [key]: [{ type: pieceType, color }],
    });

    // Update board visual
    setState(
      "boardData",
      getState("boardData", []).map((hex) => {
        if (hex.q === q && hex.r === r) {
          return { ...hex, pieceType, pieceColor: color };
        }
        return hex;
      })
    );
  };

  const movePiece = (fromQ, fromR, toQ, toR) => {
    const boardPieces = getState("boardPieces", {});
    const stackedPieces = getState("stackedPieces", {});
    const fromKey = pieceKey(fromQ, fromR);
    const toKey = pieceKey(toQ, toR);

    const fromStack = stackedPieces[fromKey] || [];
    const movingPiece = fromStack.pop();

    if (fromStack.length === 0) {
      delete boardPieces[fromKey];
      delete stackedPieces[fromKey];
    } else {
      boardPieces[fromKey] = {
        ...fromStack[fromStack.length - 1],
        height: fromStack.length,
      };
      stackedPieces[fromKey] = fromStack;
    }

    // Place at destination
    if (movingPiece.type === "beetle" && isPieceAt(toQ, toR)) {
      const toStack = stackedPieces[toKey] || [boardPieces[toKey]];
      toStack.push(movingPiece);
      stackedPieces[toKey] = toStack;
      boardPieces[toKey] = { ...movingPiece, height: toStack.length };
    } else {
      boardPieces[toKey] = { ...movingPiece, height: 1 };
      stackedPieces[toKey] = [movingPiece];
    }

    setState("boardPieces", boardPieces);
    setState("stackedPieces", stackedPieces);

    // Update visual board
    setState(
      "boardData",
      getState("boardData", []).map((hex) => {
        if (hex.q === fromQ && hex.r === fromR) {
          const newTopPiece =
            fromStack.length > 0 ? fromStack[fromStack.length - 1] : null;
          return {
            ...hex,
            pieceType: newTopPiece?.type || null,
            pieceColor: newTopPiece?.color || "transparent",
          };
        }
        if (hex.q === toQ && hex.r === toR) {
          return {
            ...hex,
            pieceType: movingPiece.type,
            pieceColor: movingPiece.color,
          };
        }
        return hex;
      })
    );
  };

  // Check win function
  const checkWin = () => {
    const boardPieces = getState("boardPieces", {});
    
    // Check if either queen is surrounded (6 neighbors occupied)
    for (const [key, piece] of Object.entries(boardPieces)) {
      if (piece.type === "queen") {
        const [q, r] = key.split(",").map(Number);
        const neighbors = getNeighbors(q, r);
        const occupiedNeighbors = neighbors.filter(neighbor => 
          isPieceAt(neighbor.q, neighbor.r)
        );
        
        if (occupiedNeighbors.length === 6) {
          // Queen is surrounded - player loses
          const winner = piece.color === "white" ? "black" : "white";
          setState("gameWon", true);
          setState("gameWinner", winner);
          
          const showToast = getState("showToast", null);
          if (showToast) {
            showToast(`${winner.charAt(0).toUpperCase() + winner.slice(1)} wins! ${piece.color} queen is surrounded!`);
          }
          
          // Show restart popup after a short delay to let the toast appear first
          setTimeout(() => {
            setState("showRestartPopup", true);
          }, 2000);
          
          return true;
        }
      }
    }
    
    return false;
  };

  // Confirm move function - to be called from BottomBar
  const confirmMove = () => {
    // Check if it's this player's turn in online mode
    const gameMode = getState("gameMode", "local");
    if (gameMode === "online") {
      const currentPlayer = getState("currentPlayer", "white");
      const playerColor = getState("playerColor", null);
      if (currentPlayer !== playerColor) {
        const showToast = getState("showToast", null);
        if (showToast) {
          showToast("Wait for your turn!");
        }
        return;
      }
      
      // Check if game has started
      if (!getState("gameStarted", false)) {
        const showToast = getState("showToast", null);
        if (showToast) {
          showToast("Waiting for opponent to join...");
        }
        return;
      }
    }
    
    const selectedHex = getState("selectedHex", { q: null, r: null });
    const selectedPiece = getState("selectedPieceInventory", null);
    const lastMoveType = getState("lastMoveType", null);
    const currentPlayer = getState("currentPlayer", "white");

    // Check if there's a move to confirm (either placement or movement)
    const canConfirm =
      (selectedHex && selectedPiece) || lastMoveType === "movement";

    if (canConfirm) {
      // Decrease piece count BEFORE switching players
      if (selectedPiece) {
        const pieceKey = `${currentPlayer}Pieces.${selectedPiece}`;
        const currentCount = getState(pieceKey, 0);
        const newCount = Math.max(0, currentCount - 1);
        setState(pieceKey, newCount);
      }

      // Add move to history
      const history = getState("moveHistory", []);
      const newMove = {
        player: currentPlayer,
        piece: selectedPiece || "movement",
        position: selectedHex,
        timestamp: Date.now(),
      };
      const updatedHistory = [...history, newMove];
      setState("moveHistory", updatedHistory);

      // Calculate next player for server
      const nextPlayer = currentPlayer === "white" ? "black" : "white";

      // Check for win condition before sending move
      const hasWon = checkWin();

      // Prepare game state to send to server - let server handle turn switching
      const gameStateToSend = {
        boardPieces: getState("boardPieces", {}),
        stackedPieces: getState("stackedPieces", {}),
        moveHistory: updatedHistory,
        gameWon: getState("gameWon", false),
        gameWinner: getState("gameWinner", null),
        currentPlayer: nextPlayer // Send the next player to server
      };

      // Send move to server - server will broadcast updated state to all players
      sendMoveToServer(gameStateToSend);

      // Clear selections and available moves (but don't change currentPlayer - wait for server)
      setState("selectedPieceInventory", null);
      setState("selectedHex", { q: null, r: null });
      setState("movementMode", false);
      setState("selectedPieceForMovement", null);
      setState("canConfirm", false);
      setState("canUndo", false);
      setState("validMoves", []);

      // Clear undo state
      setState("lastMoveType", null);
      setState("lastPlacedPiece", null);
      setState("lastMoveFrom", null);
      setState("lastMoveTo", null);

      // Clear all available spaces on the board
      setState(
        "boardData",
        getState("boardData", []).map((hex) => ({
          ...hex,
          isAvailable: false,
        }))
      );
    }
  };

  // Make confirmMove available globally so BottomBar can call it
  setState("confirmMove", confirmMove);

  // Hexagonal grid math
  const hexToPixel = (q, r, size) => {
    const x = size * ((3 / 2) * q) * spacing;
    const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r) * spacing;
    return { x, y };
  };

  // Touch/mouse handling for pan and zoom - optimized for mobile
  const handleWheel = (e) => {
    e.preventDefault();
    const zoom = getState("zoom", 1);
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newZoom = Math.max(0.3, Math.min(3, zoom + delta));
    setState("zoom", newZoom);
  };

  // Use requestAnimationFrame for smoother updates
  let animationFrameId = null;
  
  const updatePanPosition = (x, y) => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
      setState("panX", x);
      setState("panY", y);
      animationFrameId = null;
    });
  };

  const handleTouchStart = (e) => {
    // Cancel any pending animation frames
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    if (e.touches.length === 1) {
      // Single touch - start pan
      setState("lastTouch", {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        isPanning: true,
        startPanX: getState("panX", 0),
        startPanY: getState("panY", 0),
      });
    } else if (e.touches.length === 2) {
      // Two finger - start pinch zoom AND pan
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Calculate center point for simultaneous panning
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      setState("lastTouch", {
        distance,
        isPinching: true,
        isPanning: true, // Enable panning during pinch
        zoom: getState("zoom", 1),
        centerX,
        centerY,
        startPanX: getState("panX", 0),
        startPanY: getState("panY", 0),
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const lastTouch = getState("lastTouch", {});

    if (e.touches.length === 1 && lastTouch.isPanning && !lastTouch.isPinching) {
      // Single finger pan
      const deltaX = e.touches[0].clientX - lastTouch.x;
      const deltaY = e.touches[0].clientY - lastTouch.y;
      const newPanX = lastTouch.startPanX + deltaX;
      const newPanY = lastTouch.startPanY + deltaY;
      
      updatePanPosition(newPanX, newPanY);
    } else if (e.touches.length === 2 && lastTouch.isPinching) {
      // Two finger pinch zoom AND pan
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Handle zooming
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const scale = distance / lastTouch.distance;
      const newZoom = Math.max(0.3, Math.min(3, lastTouch.zoom * scale));
      
      // Handle panning - track center point movement
      const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
      const currentCenterY = (touch1.clientY + touch2.clientY) / 2;
      const centerDeltaX = currentCenterX - lastTouch.centerX;
      const centerDeltaY = currentCenterY - lastTouch.centerY;
      
      const newPanX = lastTouch.startPanX + centerDeltaX;
      const newPanY = lastTouch.startPanY + centerDeltaY;
      
      // Update both zoom and pan simultaneously
      // Only update zoom if change is significant enough
      const currentZoom = getState("zoom", 1);
      if (Math.abs(newZoom - currentZoom) > 0.01) {
        setState("zoom", newZoom);
      }
      
      updatePanPosition(newPanX, newPanY);
    }
  };

  const handleTouchEnd = () => {
    setState("lastTouch", {});
    // Cancel any pending animation frames
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  // Mouse handling for desktop - optimized
  const handleMouseDown = (e) => {
    setState("lastMouse", {
      x: e.clientX,
      y: e.clientY,
      isDragging: true,
      startPanX: getState("panX", 0),
      startPanY: getState("panY", 0),
    });
  };

  const handleMouseMove = (e) => {
    const lastMouse = getState("lastMouse", {});
    if (lastMouse.isDragging) {
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;
      const newPanX = lastMouse.startPanX + deltaX;
      const newPanY = lastMouse.startPanY + deltaY;
      
      updatePanPosition(newPanX, newPanY);
    }
  };

  const handleMouseUp = () => {
    setState("lastMouse", {});
    // Cancel any pending animation frames
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
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
        let hex = { q, r, pieceType: null, isAvailable: false };

        hexagons.push(hex);
      }
    }
    return hexagons;
  };

  if (!getState("boardData", null)) {
    const boardData = createBoardData();
    setState("boardData", boardData);
  }
  const hexSize = 50;

  return {
    render: () => ({
      div: {
        className:
          "w-full h-screen bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden relative",
        style: {
          // Enable hardware acceleration
          willChange: "transform",
          backfaceVisibility: "hidden",
          perspective: "1000px",
        },
        children: [
          // Board container
          {
            div: {
              className: "w-full h-full relative select-none",
              style: {
                touchAction: "none",
                willChange: "transform",
                "-webkit-overflow-scrolling": "touch",
              },
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
                      transform: `translate(50vw, 50vh) translate3d(${getState(
                        "panX",
                        0
                      )}px, ${getState("panY", 0)}px, 0) scale(${getState(
                        "zoom",
                        1
                      )})`,
                      "transform-origin": "0 0",
                      pointerEvents: "none",
                      // Optimize for smooth animations
                      willChange: "transform",
                      backfaceVisibility: "hidden",
                    }),
                    children: () => {
                      return getState("boardData", []).map((hex) => {
                        const { x, y } = hexToPixel(hex.q, hex.r, hexSize);
                        //console.log("Rendering hex:", hex.q, hex.r, "isAvailable:", hex.isAvailable);
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
                                  isSelected:
                                    getState("selectedHex", {
                                      r: null,
                                      q: null,
                                    }, false).r === hex.r &&
                                    getState("selectedHex", {
                                      r: null,
                                      q: null,
                                    }).q === hex.q,
                                  isAvailable: hex.isAvailable,
                                  onClick: () => handleHexClick(hex.q, hex.r),
                                  size: hexSize,
                                },
                              },
                            ],
                          },
                        };
                      });
                    },
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
export default HiveBoardOnline;
