const BottomBar = (props, context) => {
  const { getState, setState } = context;
  
  const selectedPiece = getState('selectedPieceInventory', null);
  const canConfirm = getState('canConfirm', false);
  const canUndo = getState('canUndo', false);
  const moveHistory = getState('moveHistory', []);

  // Define piece inventories for both players
  const whitePieces = [
    { type: 'queen', count: getState('whitePieces.queen', 1) },
    { type: 'beetle', count: getState('whitePieces.beetle', 2) },
    { type: 'grasshopper', count: getState('whitePieces.grasshopper', 3) },
    { type: 'spider', count: getState('whitePieces.spider', 2) },
    { type: 'ant', count: getState('whitePieces.ant', 3) }
  ];
  setState('whitePieces', whitePieces);
  const blackPieces = [
    { type: 'queen', count: getState('blackPieces.queen', 1) },
    { type: 'beetle', count: getState('blackPieces.beetle', 2) },
    { type: 'grasshopper', count: getState('blackPieces.grasshopper', 3) },
    { type: 'spider', count: getState('blackPieces.spider', 2) },
    { type: 'ant', count: getState('blackPieces.ant', 3) }
  ];
  setState('blackPieces', blackPieces);

  const handleConfirm = () => {
    const selectedHex = getState('selectedHex', null);
    const selectedPiece = getState('selectedPieceInventory', null);
    
    if (selectedHex && selectedPiece) {
      // Add move to history
      const history = getState('moveHistory', []);
      const newMove = {
        player: getState('currentPlayer', 'white'),
        piece: selectedPiece,
        position: selectedHex,
        timestamp: Date.now()
      };
      setState('moveHistory', [...history, newMove]);
      
      // Decrease piece count
      const pieceKey = `${getState('currentPlayer', 'white')}Pieces.${selectedPiece}`;
      const currentCount = getState(pieceKey, 0);
      setState(pieceKey, Math.max(0, currentCount - 1));
      
      // Switch players
      setState('currentPlayer', getState('currentPlayer', 'white') === 'white' ? 'black' : 'white');
      
      // Clear selections
      setState('selectedPieceInventory', null);
      setState('selectedHex', null);
      setState('canConfirm', false);
      setState('canUndo', true);
    }
  };

  const handleUndo = () => {
    const history = getState('moveHistory', []);
    if (history.length > 0) {
      const lastMove = history[history.length - 1];
      
      // Restore piece count
      const pieceKey = `${lastMove.player}Pieces.${lastMove.piece}`;
      const currentCount = getState(pieceKey, 0);
      setState(pieceKey, currentCount + 1);
      
      // Remove last move from history
      setState('moveHistory', history.slice(0, -1));
      
      // Switch back to previous player
      setState('currentPlayer', lastMove.player);
      
      // Update undo availability
      setState('canUndo', history.length > 1);
    }
  };

  // Check if confirm should be enabled
  const shouldEnableConfirm = () => {
    const selectedHex = getState('selectedHex', null);
    const selectedPiece = getState('selectedPieceInventory', null);
    return selectedHex && selectedPiece;
  };

  return {
    render: () => ({
      div: {
        className: 'fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-20',
        children: [
          // Current player indicator
          {
            div: {
              className: () => `text-center py-2 text-sm font-medium ${
                getState('currentPlayer', 'white') === 'white' ? 'bg-gray-100 text-gray-800' : 'bg-gray-800 text-white'
              }`,
              text: `${getState('currentPlayer', 'white').charAt(0).toUpperCase() + getState('currentPlayer', 'white').slice(1)}'s Turn`
            }
          },
          // Main content
          {
            div: {
              className: 'p-4',
              children: [
                // Pieces section
                {
                  div: {
                    className: 'mb-4',
                    children: [
                      {
                        h3: {
                          text: 'Available Pieces',
                          className: 'text-sm font-medium text-gray-700 mb-2'
                        }
                      },
                      {
                        PieceInventory: {
                          pieces: getState('currentPlayer', 'white') === 'white' ? getState('whitePieces', []) : getState('blackPieces', []),
                          player: getState('currentPlayer', 'white')
                        }
                      }
                    ]
                  }
                },
                // Action buttons
                {
                  div: {
                    className: 'flex justify-between items-center gap-4',
                    children: [
                      // Game info
                      {
                        div: {
                          className: 'text-xs text-gray-500',
                          children: [
                            { div: { text: `Move: ${moveHistory.length + 1}` } },
                            ...(selectedPiece ? [{ 
                              div: { text: `Selected: ${selectedPiece.charAt(0).toUpperCase() + selectedPiece.slice(1)}` } 
                            }] : [])
                          ]
                        }
                      },
                      // Buttons
                      {
                        div: {
                          className: 'flex gap-2',
                          children: [
                            {
                              button: {
                                text: 'Undo',
                                className: `
                                  px-4 py-2 rounded font-medium transition-colors
                                  ${canUndo 
                                    ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }
                                `,
                                onclick: canUndo ? handleUndo : undefined,
                                disabled: !canUndo
                              }
                            },
                            {
                              button: {
                                text: 'Confirm Move',
                                className: `
                                  px-6 py-2 rounded font-medium transition-colors
                                  ${shouldEnableConfirm() 
                                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }
                                `,
                                onclick: shouldEnableConfirm() ? handleConfirm : undefined,
                                disabled: !shouldEnableConfirm()
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