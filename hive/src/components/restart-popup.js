const RestartPopup = (props, context) => {
  const { getState, setState, subscribe, juris } = context;

  // Function to restart the game
  const restartGame = () => {
    // Reset all game state to initial values
    setState("currentPlayer", "white");
    setState("selectedHex", { q: null, r: null });
    setState("selectedPieceInventory", null);
    juris.stateManager.beginBatch();
    setState("boardPieces", {});
    juris.stateManager.endBatch();
    setState("stackedPieces", {});
    setState("moveHistory", []);
    setState("canConfirm", false);
    setState("canUndo", false);
    setState("validMoves", []);
    setState("selectedPieceForMovement", null);
    setState("movementMode", false);
    setState("gameWon", false);
    setState("gameWinner", null);

    // Reset piece inventories to initial state
    setState("whitePieces", {
      queen: 1,
      beetle: 2,
      grasshopper: 3,
      spider: 2,
      ant: 3
    });
    setState("blackPieces", {
      queen: 1,
      beetle: 2,
      grasshopper: 3,
      spider: 2,
      ant: 3
    });

    // Clear the board visually
    const boardData = getState("boardData", []);
    const clearedBoardData = boardData.map((hex) => ({
      ...hex,
      pieceType: null,
      pieceColor: "transparent",
      isAvailable: false
    }));
    setState("boardData", clearedBoardData);

    // For online games, notify the server
    const gameMode = getState("gameMode", "local");
    if (gameMode === "online") {
      const currentWs = getState("ws", null);
      if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        currentWs.send(JSON.stringify({
          type: 'restart',
          boardPieces: {},
          stackedPieces: {},
          moveHistory: [],
          gameWon: false,
          gameWinner: null,
          currentPlayer: "white"
        }));
      }
    }

    // Hide the popup
    setState("showRestartPopup", false);

    // Show confirmation toast
    const showToast = getState("showToast", null);
    if (showToast) {
      showToast("Game restarted!");
    }
  };

  // Function to go back to menu
  const goToMenu = () => {
    setState("showRestartPopup", false);
    
    // Disconnect from online game if applicable
    const gameMode = getState("gameMode", "local");
    if (gameMode === "online") {
      const currentWs = getState("ws", null);
      if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        currentWs.close();
      }
      setState("ws", null);
      setState("connectionStatus", "disconnected");
      setState("currentView", "onlineMenu");
    } else {
      setState("currentView", "menu");
    }
    
    // Reset game state
    restartGame();
  };

  // Function to hide popup without action
  const hidePopup = () => {
    setState("showRestartPopup", false);
  };

  return {
    render: () => {
      const showPopup = getState("showRestartPopup", false);
      const gameWinner = getState("gameWinner", null);
      const playerColor = getState("playerColor", null);
      const gameMode = getState("gameMode", "local");

      if (!showPopup) {
        return null;
      }

      // Determine if this player won or lost
      let resultMessage = "";
      let resultClass = "";
      
      if (gameMode === "online" && playerColor) {
        if (gameWinner === playerColor) {
          resultMessage = "🎉 You Won! 🎉";
          resultClass = "text-green-600";
        } else {
          resultMessage = "😔 You Lost";
          resultClass = "text-red-600";
        }
      } else {
        // Local game or general message
        if (gameWinner) {
          resultMessage = `🎉 ${gameWinner.charAt(0).toUpperCase() + gameWinner.slice(1)} Wins! 🎉`;
          resultClass = "text-green-600";
        } else {
          resultMessage = "Game Over";
          resultClass = "text-gray-600";
        }
      }

      return {
        div: {
          className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          onclick: (e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              hidePopup();
            }
          },
          children: [
            {
              div: {
                className: "bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 transform transition-all",
                children: [
                  // Game result header
                  {
                    div: {
                      className: "text-center mb-6",
                      children: [
                        {
                          h2: {
                            className: `text-2xl font-bold mb-2 ${resultClass}`,
                            text: resultMessage
                          }
                        },
                      ]
                    }
                  },
                  
                  // Action buttons
                  {
                    div: {
                      className: "flex flex-col space-y-3",
                      children: [
                        // Play Again button
                        {
                          button: {
                            className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                            onclick: restartGame,
                            children: "Play Again",
                          }
                        },
                        
                        // Back to Menu button
                        {
                          button: {
                            className: "w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                            onclick: goToMenu,
                            children: [
                              {
                                span: {
                                  className: "flex items-center justify-center",
                                  text: "Back to Menu"
                                }
                              }
                            ]
                          }
                        },
                        
                        // Continue Watching button (closes popup but stays in game)
                        {
                          button: {
                            className: "w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                            onclick: hidePopup,
                            children: [
                              {
                                span: {
                                  className: "flex items-center justify-center",
                                  text: "Continue Watching"
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
      };
    }
  };
};

export default RestartPopup;
