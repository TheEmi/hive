const OnlineMenu = (props, context) => {
  const { getState, setState, subscribe, juris } = context;

  // WebSocket connection
  let ws = null;
  const serverUrl = 'wss://hiveapi.hodoroaba.com';

  // Initialize WebSocket connection
  const initWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    ws = new WebSocket(serverUrl);

    ws.onopen = () => {
      setState("connectionStatus", "connected");
      setState("ws", ws); // Store WebSocket in global state when connected
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (error) {
        console.error('Error parsing server message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from game server');
      setState("connectionStatus", "disconnected");
      setState("ws", null); // Clear WebSocket from global state when disconnected
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (getState("shouldReconnect", true)) {
          initWebSocket();
        }
      }, 3000);
    };
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setState("connectionStatus", "error");
      setState("ws", null); // Clear WebSocket from global state on error
    };
  };

  // Handle messages from server
  const handleServerMessage = (message) => {
    const showToast = getState("showToast", null);
    
    switch (message.type) {
      case 'connected':
        setState("playerId", message.playerId);
        break;
        
      case 'roomCreated':
        setState("roomId", message.roomId);
        setState("playerColor", message.playerColor);
        setState("isHost", true);
        if (showToast) {
          showToast(`Room created! Code: ${message.roomId}`);
        }
        break;
        
      case 'roomJoined':
        setState("roomId", message.roomId);
        setState("playerColor", message.playerColor);
        setState("currentPlayer", "white");

        setState("isHost", false);
        if (showToast) {
          showToast(`Joined room: ${message.roomId}`);
        }
        break;
        
      case 'roomState':
        setState("roomPlayers", message.players);
        setState("canStartGame", message.canStart);
        if (message.canStart && !getState("gameStarted", false)) {
          setState("gameStarted", true);
          if (showToast) {
            showToast("Game started! Both players connected.");
          }
        }
        break;
        
      case 'move':
        // Handle move messages from server - update game state
        if (message.gameState) {
          setState("currentPlayer", message.gameState.currentPlayer);
          juris.stateManager.beginBatch();
          setState("boardPieces", message.gameState.boardPieces);
          juris.stateManager.endBatch();
          setState("stackedPieces", message.gameState.stackedPieces);
          setState("moveHistory", message.gameState.moveHistory);
          setState("gameWon", message.gameState.gameWon);
          setState("gameWinner", message.gameState.gameWinner);
        }
        break;
      case "gameStateUpdate":
        if (message.gameState) {
          setState("currentPlayer", message.gameState.currentPlayer);
          juris.stateManager.beginBatch();
          setState("boardPieces", message.gameState.boardPieces);
          juris.stateManager.endBatch();
          setState("stackedPieces", message.gameState.stackedPieces);
          setState("moveHistory", message.gameState.moveHistory);
          setState("gameWon", message.gameState.gameWon);
          setState("gameWinner", message.gameState.gameWinner);
        }
        break;
      case 'gameRestarted':
        // Handle restart message from server
        if (message.gameState) {
          setState("currentPlayer", message.gameState.currentPlayer);
          juris.stateManager.beginBatch();
          setState("boardPieces", message.gameState.boardPieces);
          juris.stateManager.endBatch();
          setState("stackedPieces", message.gameState.stackedPieces);
          setState("moveHistory", message.gameState.moveHistory);
          setState("gameWon", message.gameState.gameWon);
          setState("gameWinner", message.gameState.gameWinner);
          
          // Reset piece inventories
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
          
          if (showToast) {
            showToast("Game restarted!");
          }
        }
        break;
      case 'error':
        if (showToast) {
          showToast(`Error: ${message.message}`);
        }
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Room management functions
  const createRoom = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'createRoom' }));
    }
  };

  const joinRoom = (roomId) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'joinRoom', 
        roomId: roomId.toUpperCase() 
      }));
    }
  };

  // Make WebSocket functions available globally for the board-online component
  setState("createRoom", createRoom);
  setState("joinRoom", joinRoom);
  // Don't store ws here - it will be stored when connection is established

  // Initialize WebSocket connection when component loads
  initWebSocket();

  // Cleanup function
  const cleanup = () => {
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

  const handleCreateRoom = () => {
    createRoom();
  };

  const handleJoinRoom = () => {
    const roomCode = getState("joinRoomCode", "");
    
    if (!roomCode.trim()) {
      const showToast = getState("showToast", null);
      if (showToast) {
        showToast("Please enter a room code");
      }
      return;
    }
    
    joinRoom(roomCode.trim());
  };

  const handleRoomCodeChange = (e) => {
    setState("joinRoomCode", e.target.value.toUpperCase());
  };

  const handleBackToMenu = () => {
    setState("currentView", "menu");
  };

  return {
    render: () => {
      

      return {
        div: {
          className: "min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4",
          children: ()=>{
            const connectionStatus = getState("connectionStatus", "disconnected");
      const roomId = getState("roomId", null);
      const playerColor = getState("playerColor", null);
      const gameStarted = getState("gameStarted", false);
      const roomPlayers = getState("roomPlayers", []);
      const joinRoomCode = getState("joinRoomCode", "");
            return [
            {
              div: {
                className: "bg-white rounded-xl shadow-2xl p-8 w-full max-w-md",
                children: [
                  // Title
                  {
                    h1: {
                      className: "text-3xl font-bold text-gray-800 text-center mb-8",
                      textContent: "Online Hive"
                    }
                  },
                  
                  // Connection Status
                  {
                    div: {
                      className: "mb-6 text-center",
                      children: [
                        {
                          div: {
                            className: ()=>`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              connectionStatus === "connected" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`,
                            children: [
                              {
                                div: {
                                  className: ()=>`w-2 h-2 rounded-full mr-2 ${
                                    connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"
                                  }`
                                }
                              },
                              {
                                span: {
                                  textContent: ()=>connectionStatus === "connected" ? "Connected" : "Disconnected"
                                }
                              }
                            ]
                          }
                        }
                      ]
                    }
                  },

                  // Room Info (if in a room)
                  ...(roomId ? [{
                    div: {
                      className: "mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200",
                      children: [
                        {
                          h3: {
                            className: "font-semibold text-amber-800 mb-2",
                            textContent: "Room Information"
                          }
                        },
                        {
                          p: {
                            className: "text-sm text-amber-700 mb-1",
                            textContent: `Room Code: ${roomId}`
                          }
                        },
                        {
                          p: {
                            className: "text-sm text-amber-700 mb-1",
                            textContent: `Your Color: ${playerColor || "Not assigned"}`
                          }
                        },
                        {
                          p: {
                            className: "text-sm text-amber-700",
                            textContent: `Players: ${roomPlayers.length}/2`
                          }
                        },
                        ...(gameStarted ? [{
                          div: {
                            className: "mt-2 flex justify-center",
                            children: [
                              {
                                button: {
                                  className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors",
                                  textContent: "Go to Game",
                                  onclick: () => {
                                    setState("currentPlayer", playerColor);
                                    setState("currentView", "online");
                                    setState("gameMode", "online"); // Keep for compatibility
                                  }
                                }
                              }
                            ]
                          }
                        }] : [])
                      ]
                    }
                  }] : []),

                  // Room Controls (if not in a room)
                  ...((!roomId && connectionStatus === "connected") ? [
                    // Create Room
                    {
                      button: {
                        className: "w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4",
                        textContent: "Create Room",
                        onclick: handleCreateRoom
                      }
                    },
                    
                    // Divider
                    {
                      div: {
                        className: "relative mb-4",
                        children: [
                          {
                            div: {
                              className: "absolute inset-0 flex items-center",
                              children: [
                                {
                                  div: {
                                    className: "w-full border-t border-gray-300"
                                  }
                                }
                              ]
                            }
                          },
                          {
                            div: {
                              className: "relative flex justify-center text-sm",
                              children: [
                                {
                                  span: {
                                    className: "px-2 bg-white text-gray-500",
                                    textContent: "or"
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    },
                    
                    // Join Room
                    {
                      div: {
                        className: "space-y-3",
                        children: [
                          {
                            input: {
                              type: "text",
                              name: "joinRoomCode",
                              id: "joinRoomCode",
                              placeholder: "Enter room code",
                              className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                              value: joinRoomCode,
                              onchange: handleRoomCodeChange,
                              maxlength: 6
                            }
                          },
                          {
                            button: {
                              className: "w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors",
                              textContent: "Join Room",
                              onclick: handleJoinRoom
                            }
                          }
                        ]
                      }
                    }
                  ] : []),

                  // Back Button
                  {
                    div: {
                      className: "mt-6 pt-4 border-t border-gray-200",
                      children: [
                        {
                          button: {
                            className: "w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors",
                            textContent: "Back to Main Menu",
                            onclick: handleBackToMenu
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]}
        }
      };
    }
  };
};

export default OnlineMenu;
