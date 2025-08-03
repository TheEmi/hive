const MainMenu = (props, context) => {
  const { getState, setState } = context;

  const handleLocalMode = () => {
    setState('currentView', 'local');
    setState('gameMode', 'local'); // Keep for compatibility
  };

  const handleOnlineMode = () => {
    setState('currentView', 'onlineMenu');
  };

  const handleInstructions = () => {
    setState('showInstructions', true);
  };

  return {
    render: () => ({
      div: {
        className: 'fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50',
        children: [
          {
            div: {
              className: 'bg-slate-800 p-10 rounded-lg shadow-2xl text-center min-w-80',
              children: [
                {
                  h1: {
                    text: 'Hive Game',
                    className: 'text-white text-4xl mb-8 font-bold'
                  }
                },
                {
                  div: {
                    className: 'flex flex-col gap-5',
                    children: [
                      {
                        button: {
                          text: 'Local Mode',
                          className: 'px-8 py-4 text-xl bg-green-600 hover:bg-green-500 text-white border-none rounded-md cursor-pointer transition-all duration-300 hover:-translate-y-0.5',
                          onClick: handleLocalMode
                        }
                      },
                      {
                        button: {
                          text: 'Online Mode',
                          className: 'px-8 py-4 text-xl bg-blue-600 hover:bg-blue-500 text-white border-none rounded-md cursor-pointer transition-all duration-300 hover:-translate-y-0.5',
                          onClick: handleOnlineMode
                        }
                      },
                      {
                        button: {
                          text: 'How to Play',
                          className: 'px-8 py-4 text-xl bg-purple-600 hover:bg-purple-500 text-white border-none rounded-md cursor-pointer transition-all duration-300 hover:-translate-y-0.5',
                          onClick: handleInstructions
                        }
                      }
                    ]
                  }//menu-buttons
                },
                {
                  div: {
                    className: 'mt-8 text-gray-300 text-sm leading-relaxed',
                    children: [
                      {
                        p: {
                          text: () => {
                            const selectedMode = getState('gameMode', null);
                            if (selectedMode === 'local') {
                              return 'Local Mode: Play against another player on the same device';
                            } else if (selectedMode === 'online') {
                              return 'Online Mode: Play against players over the internet';
                            }
                            return 'Choose your game mode to start playing Hive';
                          }
                        }
                      }
                    ]
                  }//menu-description
                }
              ]
            }//menu-content
          }
        ]
      }//main-menu
    })
  };
};

export default MainMenu;