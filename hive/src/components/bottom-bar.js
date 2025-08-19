const BottomBar = (props, context) => {
  const { getState, setState, juris } = context;
  
  // Initialize mobile UI state
  if (!getState("bottomBarInitialized", false)) {
    setState("bottomBarCollapsed", false);
    setState("bottomBarInitialized", true);
  }
  
  const selectedPiece = getState('selectedPieceInventory', null);
  const canConfirm = getState('canConfirm', false);
  const canUndo = getState('canUndo', false);
  const moveHistory = getState('moveHistory', []);
  const currentPlayer = getState('currentPlayer', 'white');
  
  const toggleCollapse = () => {
    setState("bottomBarCollapsed", !getState("bottomBarCollapsed", false));
  };
  
  // Check if Queen placement is required
  const isQueenRequired = () => {
    const playerMoves = moveHistory.filter(move => move.player === currentPlayer && move.piece !== 'movement');
    const hasQueen = playerMoves.some(move => move.piece === 'queen');
    return playerMoves.length >= 3 && !hasQueen;
  };

  // Define piece inventories for both players - only initialize if not already set
  if (!getState('piecesInitialized', false)) {
    // Initialize white pieces
    setState('whitePieces.queen', 1);
    setState('whitePieces.beetle', 2);
    setState('whitePieces.grasshopper', 3);
    setState('whitePieces.spider', 2);
    setState('whitePieces.ant', 3);
    
    // Initialize black pieces
    setState('blackPieces.queen', 1);
    setState('blackPieces.beetle', 2);
    setState('blackPieces.grasshopper', 3);
    setState('blackPieces.spider', 2);
    setState('blackPieces.ant', 3);
    
    setState('piecesInitialized', true);
  }

  const handleConfirm = () => {
    if(!getState('canConfirm', false)) return;
    const confirmMove = getState('confirmMove', () => {});
    confirmMove();
  };

  const handleUndo = () => {
    if (!getState('canUndo', false)) return;
    const lastMoveType = getState('lastMoveType', null);
    
    if (lastMoveType === 'placement') {
      // Undo piece placement
      const lastPlacedPiece = getState('lastPlacedPiece', null);
      if (lastPlacedPiece) {
        const { q, r } = lastPlacedPiece;
        getState("boardData", []).map((hex, index) => {
          if (hex.q === q && hex.r === r) {
            setState(`boardData.${index}`, { ...hex, pieceType: null, pieceColor: "transparent" });
          }
        })
        // Remove from boardPieces and stackedPieces
        const boardPieces = getState("boardPieces", {});
        const stackedPieces = getState("stackedPieces", {});
        const key = `${q},${r}`;
        
        const newBoardPieces = { ...boardPieces };
        const newStackedPieces = { ...stackedPieces };
        delete newBoardPieces[key];
        delete newStackedPieces[key];
        
        setState("boardPieces", newBoardPieces);
        setState("stackedPieces", newStackedPieces);
      }
    } else if (lastMoveType === 'movement') {
      // Undo piece movement
      const lastMoveFrom = getState('lastMoveFrom', null);
      const lastMoveTo = getState('lastMoveTo', null);
      const originalFromStack = getState('lastMoveOriginalFromStack', []);
      const originalToStack = getState('lastMoveOriginalToStack', []);
      
      if (lastMoveFrom && lastMoveTo) {
        const boardPieces = getState("boardPieces", {});
        const stackedPieces = getState("stackedPieces", {});
        const fromKey = `${lastMoveFrom.q},${lastMoveFrom.r}`;
        const toKey = `${lastMoveTo.q},${lastMoveTo.r}`;
        
        const newBoardPieces = { ...boardPieces };
        const newStackedPieces = { ...stackedPieces };
        
        // Restore original stacks
        if (originalFromStack.length > 0) {
          newBoardPieces[fromKey] = { ...originalFromStack[originalFromStack.length - 1], height: originalFromStack.length };
          newStackedPieces[fromKey] = [...originalFromStack];
        } else {
          delete newBoardPieces[fromKey];
          delete newStackedPieces[fromKey];
        }
        
        if (originalToStack.length > 0) {
          newBoardPieces[toKey] = { ...originalToStack[originalToStack.length - 1], height: originalToStack.length };
          newStackedPieces[toKey] = [...originalToStack];
        } else {
          delete newBoardPieces[toKey];
          delete newStackedPieces[toKey];
        }
        
        setState("boardPieces", newBoardPieces);
        setState("stackedPieces", newStackedPieces);
        
        // Update board visual
        getState("boardData", []).map((hex,index) => {
          if (hex.q === lastMoveTo.q && hex.r === lastMoveTo.r) {
            const newTopPiece = originalToStack.length > 0 ? originalToStack[originalToStack.length - 1] : null;
            setState(`boardData.${index}`, { ...hex, pieceType: newTopPiece ? newTopPiece.type : null, pieceColor: newTopPiece ? newTopPiece.color : "transparent" });
          }
          if (hex.q === lastMoveFrom.q && hex.r === lastMoveFrom.r) {
            const restoredTopPiece = originalFromStack.length > 0 ? originalFromStack[originalFromStack.length - 1] : null;
            setState(`boardData.${index}`, { ...hex, pieceType: restoredTopPiece ? restoredTopPiece.type : null, pieceColor: restoredTopPiece ? restoredTopPiece.color : "transparent" });
          }
        })
      }
    }

    // Clear selections and available moves
    setState("selectedHex", { q: null, r: null });
    juris.stateManager.beginBatch();
    setState("selectedPieceInventory", null);
    juris.stateManager.endBatch();
    setState("movementMode", false);
    setState("selectedPieceForMovement", null);
    setState("canUndo", false);
    setState("canConfirm", false);
    setState("validMoves", []);
    setState("lastMoveType", null);
    setState("lastPlacedPiece", null);
    setState("lastMoveFrom", null);
    setState("lastMoveTo", null);
    setState("lastMoveOriginalFromStack", null);
    setState("lastMoveOriginalToStack", null);
    
    // Clear all available spaces on the board
    getState("boardData", []).map((hex,index) => {
      setState(`boardData.${index}`, { ...hex, isAvailable: false });
    });
  };
  setState("undoFunction", handleUndo);

  return {
    render: () => ({
      div: {
        className: 'fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-20',
        children: [
          // Always visible action bar with buttons and player info
          {
            div: {
              className: () => `flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 ${
                getState('currentPlayer', 'white') === 'white' ? 'bg-gray-50' : 'bg-gray-100'
              }`,
              children: [
                // Current player and move info (compact)
                {
                  div: {
                    className: 'flex-1 min-w-0',
                    children: [
                      {
                        div: {
                          className: () => `text-sm font-medium ${
                            getState('currentPlayer', 'white') === 'white' ? 'text-gray-800' : 'text-gray-800'
                          }`,
                          text: ()=> `${getState('currentPlayer', 'white').charAt(0).toUpperCase() + getState('currentPlayer', 'white').slice(1)}'s turn`
                        }
                      },
                      ...(isQueenRequired() ? [
                        {
                          div: {
                            text: "⚠️ Queen required!",
                            className: "text-red-500 font-bold text-xs"
                          }
                        }
                      ] : []),
                      ...(getState("selectedPieceInventory",null) ? [{ 
                        div: { 
                          text: ()=> `Selected: ${getState("selectedPieceInventory",null)?.charAt(0).toUpperCase() + getState("selectedPieceInventory",null)?.slice(1)}`,
                          className: "text-xs text-gray-500"
                        } 
                      }] : [])
                    ]
                  }
                },
                // Mobile toggle button for pieces
                {
                  button: {
                    className: 'md:hidden mx-2 p-1.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors',
                    onclick: toggleCollapse,
                    children: [
                      {
                        svg: {
                          className: () => `w-4 h-4 transition-transform duration-300`,
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24",
                          children: ()=>[
                            getState("bottomBarCollapsed", false) ?
                            {
                              path: {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: "2",
                                d: "M5 15l7-7 7 7"
                              }
                            } : {
                              path: {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: "2",
                                d: "M19 9l-7 7-7-7"
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                },
                // Action buttons (always visible)
                {
                  div: {
                    className: 'flex gap-2',
                    children: [
                      {
                        button: {
                          text: 'Undo',
                          className: ()=>`
                            px-3 py-1.5 text-sm rounded font-medium transition-colors
                            ${getState('canUndo', false) 
                              ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }
                          `,
                          onclick: handleUndo,
                          disabled: ()=> !getState('canUndo', false)
                        }
                      },
                      {
                        button: {
                          text: 'Confirm',
                          className: ()=> `
                            px-4 py-1.5 text-sm rounded font-medium transition-colors
                            ${getState('canConfirm', false) 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }
                          `,
                          onclick: handleConfirm,
                          disabled: ()=>!getState('canConfirm', false )
                        }
                      }
                    ]
                  }
                }
              ]
            }
          },
          // Collapsible pieces section
          {
            div: {
              className: () => `transition-all duration-300 overflow-hidden ${
                getState("bottomBarCollapsed", false) ? 'max-h-0' : 'max-h-24'
              }`,
              children: [
                {
                  div: {
                    className: 'p-2 bg-gray-50',
                    children: [
                      {
                        div: {
                          className: 'overflow-x-auto justify-center',
                          children: [
                            {
                              PieceInventory: {
                                pieces: getState('currentPlayer', 'white') === 'white' ? getState('whitePieces', []) : getState('blackPieces', []),
                                player: getState('currentPlayer', 'white'),
                                compact: true
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    })
  };
};
export default BottomBar;