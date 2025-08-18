const PieceInventory = (props, context) => {
  const { getState, setState, juris } = context;

  const onSelect = (pieceType) => {
    if (getState("gameWon", false)) return; // Ignore clicks if game is already won
    
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
    
    if (getState("canUndo", false)) {
      const undoFunction = getState("undoFunction", null);
      if (undoFunction) {
        undoFunction();
      }
    }
    const currentPlayer = getState("currentPlayer", "white");
    const count = getState(`${currentPlayer}Pieces.${pieceType}`, 0);

    // Don't allow selection if piece count is 0
    if (pieceType && count === 0) {
      const showToast = getState("showToast", null);
      if (showToast) {
        showToast(`No ${pieceType} pieces remaining`);
      }
      return;
    }

    // Check Queen placement requirement
    const moveHistory = getState("moveHistory", []);
    const playerMoves = moveHistory.filter(
      (move) => move.player === currentPlayer && move.piece !== "movement"
    );
    const hasQueen = playerMoves.some((move) => move.piece === "queen");
    const isQueenRequired = playerMoves.length >= 3 && !hasQueen;

    if (isQueenRequired && pieceType !== "queen") {
      const showToast = getState("showToast", null);
      if (showToast) {
        showToast("Queen must be placed by your 4th piece");
      }
      return;
    }

    const currentSelection = getState("selectedPieceInventory", null);
    // Toggle selection - if same piece clicked, deselect
    if (currentSelection === pieceType) {
      setState("validMoves", []);
      setState("selectedPieceInventory", null);
        const newBoardPieces = getState("boardData", []).map((hex,index) => {
          if (hex.isAvailable) {
            setState(`boardData.${index}`, { ...hex, isAvailable: false }); // Clear available spaces
          }
        });
    } else {
      setState("selectedPieceInventory", pieceType);
      getState("calculateValidMoves", () => {})();
      setState("movementMode", false);
    }
    setState("selectedHex", { q: null, r: null }); // Clear selected hex on piece selection
    setState("canConfirm", false);
  };

  return {
    render: () => ({
      div: {
        className: props.compact ? "flex gap-1 overflow-x-auto justify-center" : "flex flex-wrap gap-2 justify-center",
        children: () => {
          const currentPlayer = getState("currentPlayer", "white");
          const hasQueen =
            getState(`${currentPlayer}Pieces.queen`, 0, false) > 0;
          const totalPieces = Object.values(
            getState(`${currentPlayer}Pieces`, {}, false)
          ).reduce((acc, curr) => {
            return acc + curr;
          }, 0);
          const isQueenRequired = totalPieces < 9 && hasQueen;
          return Object.entries(
            getState(`${currentPlayer}Pieces`, {}, false)
          ).map(([type, count]) => {
            const isDisabled =
              count === 0 || (isQueenRequired && type !== "queen");
            // console.log(`${currentPlayer}Pieces.${type}`, getState(`${currentPlayer}Pieces.${type}`, 0));
            // console.log(`${currentPlayer}Pieces.`, Object.entries(getState(`${player}Pieces`, {})));

            return {
              div: {
                key: `${type}`,
                className: () => `
                  relative cursor-pointer transition-all duration-200 flex-shrink-0
                  ${
                    isDisabled
                      ? "opacity-30 cursor-not-allowed"
                      : ""
                  }
                  ${
                    isQueenRequired && type !== "queen"
                      ? "border-2 border-red-500"
                      : ""
                  }
                `,
                children: [
                  {
                    HiveHexagonDisplay: {
                      pieceType: type,
                      pieceColor: getState("currentPlayer", "white", false),
                      isSelected:
                        getState("selectedPieceInventory", null) === type,
                      onClick: isDisabled ? () => {} : () => onSelect(type),
                      size: props.compact ? 37 : 50,
                    },
                  },
                  // Count badge
                  {
                    div: {
                      className: () => `
                        absolute top-1.5 -right-0.5 ${props.compact ? 'w-4 h-4 text-xs' : 'w-5 h-5 text-xs'} rounded-full 
                        bg-blue-500 text-white flex items-center justify-center z-1500
                        ${count === 0 ? "bg-red-500" : ""}
                      `,
                      text: () => count,
                    },
                  },
                  // Piece name tooltip (hide in compact mode)
                  ...(props.compact ? [] : [
                    {
                      div: {
                        className:
                          "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none",
                        text: () => type.charAt(0).toUpperCase() + type.slice(1),
                      },
                    }
                  ]),
                  // Queen required indicator
                  ...(isQueenRequired && type !== "queen"
                    ? [
                        {
                          div: {
                            className:
                              "absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50 rounded text-white text-xs font-bold",
                            text: "👑",
                          },
                        },
                      ]
                    : []),
                ],
              },
            };
          });
        },
      },
    }),
  };
};
export default PieceInventory;
