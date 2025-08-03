const InstructionsPage = (props, context) => {
  const { getState, setState } = context;

  const handleBack = () => {
    setState('showInstructions', false);
  };

  return {
    render: () => ({
      div: {
        className: 'fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4',
        children: [
          {
            div: {
              className: 'bg-slate-800 rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto',
              children: [
                // Header
                {
                  div: {
                    className: 'sticky top-0 bg-slate-800 p-6 border-b border-slate-600 flex justify-between items-center  z-1000',
                    children: [
                      {
                        h1: {
                          text: 'How to Play Hive',
                          className: 'text-white text-3xl font-bold'
                        }
                      },
                      {
                        button: {
                          text: '×',
                          className: 'text-white text-2xl hover:text-red-500 bg-transparent border-none cursor-pointer',
                          onClick: handleBack
                        }
                      }
                    ]
                  }
                },
                // Content
                {
                  div: {
                    className: 'p-6 text-white space-y-6',
                    children: [
                      // Game Overview
                      {
                        div: {
                          children: [
                            {
                              h2: {
                                text: 'Game Overview',
                                className: 'text-2xl font-bold text-yellow-500 mb-3'
                              }
                            },
                            {
                              p: {
                                text: 'Hive is a strategic board game where you surround your opponent\'s Queen Bee to win. The game uses hexagonal tiles representing different insects, each with unique movement abilities.',
                                className: 'text-gray-300 leading-relaxed'
                              }
                            }
                          ]
                        }
                      },
                      // Basic Rules
                      {
                        div: {
                          children: [
                            {
                              h2: {
                                text: 'Basic Rules',
                                className: 'text-2xl font-bold text-yellow-500 mb-3'
                              }
                            },
                            {
                              ul: {
                                className: 'text-gray-300 space-y-2 list-disc list-inside',
                                children: [
                                  { li: { text: '🐝 You must place your Queen Bee within your first 4 moves' } },
                                  { li: { text: '🔒 You cannot move any pieces until your Queen Bee is placed' } },
                                  { li: { text: '🔗 All pieces must stay connected (no isolated pieces)' } },
                                  { li: { text: '🚫 You cannot place pieces next to opponent pieces (except 2nd move)' } },
                                  { li: { text: '🎯 Win by completely surrounding your opponent\'s Queen Bee' } },
                                  { li: { text: '🤝 Draw if both Queen Bees are surrounded simultaneously' } }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      // Piece Types
                      {
                        div: {
                          children: [
                            {
                              h2: {
                                text: 'Piece Types & Movement',
                                className: 'text-2xl font-bold text-yellow-500 mb-3'
                              }
                            },
                            {
                              div: {
                                className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
                                children: [
                                  {
                                    div: {
                                      className: 'bg-slate-700 p-4 rounded flex items-start gap-3',
                                      children: [
                                        {
                                          div: {
                                            className: 'flex-shrink-0',
                                            children: [
                                              {
                                                HiveHexagon: {
                                                  pieceType: 'queen',
                                                  pieceColor: 'white',
                                                  size: 50
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          div: {
                                            children: [
                                              { h3: { text: 'Queen Bee (1)', className: 'font-bold text-yellow-300 mb-2' } },
                                              { p: { text: 'Moves one space in any direction. Must be placed by turn 4.', className: 'text-sm text-gray-300' } }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    div: {
                                      className: 'bg-slate-700 p-4 rounded flex items-start gap-3',
                                      children: [
                                        {
                                          div: {
                                            className: 'flex-shrink-0',
                                            children: [
                                              {
                                                HiveHexagon: {
                                                  pieceType: 'beetle',
                                                  pieceColor: 'white',
                                                  size: 50
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          div: {
                                            children: [
                                              { h3: { text: 'Beetle (2)', className: 'font-bold text-purple-300 mb-2' } },
                                              { p: { text: 'Moves one space and can climb on top of other pieces.', className: 'text-sm text-gray-300' } }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    div: {
                                      className: 'bg-slate-700 p-4 rounded flex items-start gap-3',
                                      children: [
                                        {
                                          div: {
                                            className: 'flex-shrink-0',
                                            children: [
                                              {
                                                HiveHexagon: {
                                                  pieceType: 'grasshopper',
                                                  pieceColor: 'white',
                                                  size: 50
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          div: {
                                            children: [
                                              { h3: { text: 'Grasshopper (3)', className: 'font-bold text-green-300 mb-2' } },
                                              { p: { text: 'Jumps over adjacent pieces in a straight line.', className: 'text-sm text-gray-300' } }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    div: {
                                      className: 'bg-slate-700 p-4 rounded flex items-start gap-3',
                                      children: [
                                        {
                                          div: {
                                            className: 'flex-shrink-0',
                                            children: [
                                              {
                                                HiveHexagon: {
                                                  pieceType: 'spider',
                                                  pieceColor: 'white',
                                                  size: 50
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          div: {
                                            children: [
                                              { h3: { text: 'Spider (2)', className: 'font-bold text-red-300 mb-2' } },
                                              { p: { text: 'Moves exactly 3 spaces around the hive perimeter.', className: 'text-sm text-gray-300' } }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    div: {
                                      className: 'bg-slate-700 p-4 rounded flex items-start gap-3',
                                      children: [
                                        {
                                          div: {
                                            className: 'flex-shrink-0',
                                            children: [
                                              {
                                                HiveHexagon: {
                                                  pieceType: 'ant',
                                                  pieceColor: 'white',
                                                  size: 50
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          div: {
                                            children: [
                                              { h3: { text: 'Ant (3)', className: 'font-bold text-blue-300 mb-2' } },
                                              { p: { text: 'Moves any number of spaces around the hive perimeter.', className: 'text-sm text-gray-300' } }
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
                      },
                      // Game Flow
                      {
                        div: {
                          children: [
                            {
                              h2: {
                                text: 'Game Flow',
                                className: 'text-2xl font-bold text-yellow-500 mb-3'
                              }
                            },
                            {
                              div: {
                                className: 'space-y-4',
                                children: [
                                  {
                                    div: {
                                      children: [
                                        { h3: { text: 'Placing Pieces', className: 'text-lg font-semibold text-blue-300 mb-2' } },
                                        {
                                          ol: {
                                            className: 'text-gray-300 space-y-1 list-decimal list-inside ml-4',
                                            children: [
                                              { li: { text: '📝 Select a piece from your inventory at the bottom' } },
                                              { li: { text: '🎯 Available placement spots will be highlighted in yellow' } },
                                              { li: { text: '⚠️ Remember: Queen must be placed by your 4th turn!' } },
                                              { li: { text: '🚫 Cannot place next to opponent pieces (except 2nd move)' } }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    div: {
                                      children: [
                                        { h3: { text: 'Moving Pieces', className: 'text-lg font-semibold text-green-300 mb-2' } },
                                        {
                                          ol: {
                                            className: 'text-gray-300 space-y-1 list-decimal list-inside ml-4',
                                            children: [
                                              { li: { text: '🎯 Click on one of your pieces already on the board' } },
                                              { li: { text: '✨ Valid move destinations will be highlighted' } },
                                              { li: { text: '🔗 Movement must maintain hive connectivity' } },
                                              { li: { text: '🐛 Only beetles can move onto occupied spaces (stacking)' } },
                                              { li: { text: '🚫 Cannot move pieces that would break the hive apart' } }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    div: {
                                      children: [
                                        { h3: { text: 'Turn Completion', className: 'text-lg font-semibold text-purple-300 mb-2' } },
                                        {
                                          ol: {
                                            className: 'text-gray-300 space-y-1 list-decimal list-inside ml-4',
                                            children: [
                                              { li: { text: '✅ Click "Confirm Move" to finalize your turn' } },
                                              { li: { text: '↩️ Click "Undo" to cancel before confirming' } },
                                              { li: { text: '🔄 Turn automatically switches to opponent after confirmation' } },
                                              { li: { text: '🏆 Game ends when a Queen is completely surrounded' } }
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
                      },
                      // Controls
                      {
                        div: {
                          children: [
                            {
                              h2: {
                                text: 'Controls',
                                className: 'text-2xl font-bold text-yellow-500 mb-3'
                              }
                            },
                            {
                              ul: {
                                className: 'text-gray-300 space-y-2 list-disc list-inside',
                                children: [
                                  { li: { text: '🖱️ Click pieces in inventory to select for placement' } },
                                  { li: { text: '🎯 Click pieces on board to select for movement' } },
                                  { li: { text: '🔍 Mouse wheel or pinch to zoom' } },
                                  { li: { text: '✋ Drag to pan around the board' } },
                                  { li: { text: '📚 Hover over stacked pieces to see stack contents' } }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      // Tips
                      {
                        div: {
                          children: [
                            {
                              h2: {
                                text: 'Strategy Tips',
                                className: 'text-2xl font-bold text-yellow-500 mb-3'
                              }
                            },
                            {
                              ul: {
                                className: 'text-gray-300 space-y-2 list-disc list-inside',
                                children: [
                                  { li: { text: '🛡️ Protect your Queen Bee early in the game' } },
                                  { li: { text: '⚡ Use Ants for mobility and board control' } },
                                  { li: { text: '🔗 Beetles can block opponent pieces by climbing on them' } },
                                  { li: { text: '🦗 Grasshoppers are great for surprise attacks' } },
                                  { li: { text: '🕷️ Spiders provide precise positioning' } },
                                  { li: { text: '🎯 Try to surround opponent pieces to limit their options' } }
                                ]
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                },
                // Footer
                {
                  div: {
                    className: 'sticky bottom-0 bg-slate-800 p-4 border-t border-slate-600 text-center',
                    children: [
                      {
                        button: {
                          text: 'Back to Menu',
                          className: 'px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors',
                          onClick: handleBack
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

export default InstructionsPage;
