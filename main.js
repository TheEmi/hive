import HiveBoard from "./src/components/board.js"; 
import HiveBoardOnline from "./src/components/board-online.js";
import BottomBar from "./src/components/bottom-bar.js";
import HiveHexagon from "./src/components/hex.js";
import MainMenu from "./src/components/menu.js";
import OnlineMenu from "./src/components/online-menu.js";
import PieceInventory from "./src/components/piece-inventory.js";
import InstructionsPage from "./src/components/instructions.js";
import Toast from "./src/components/toast.js";
import Juris from "./src/juris/juris.js";

const App = (props, context) => {
  const { getState, setState } = context;

  return {
    render: () => ({
      div: {
        children: ()=>{
          // Show instructions if flag is set
          if (getState('showInstructions', false)) {
            return [{ InstructionsPage: {} }, { Toast: {} }];
          }
          
          // Check for currentView state first, then fallback to gameMode for compatibility
          const currentView = getState('currentView', getState('gameMode', 'menu'));
          
          switch (currentView) {
            case 'menu':
              return [{ MainMenu: {} }, { Toast: {} }];
            case 'onlineMenu':
              return [{ OnlineMenu: {} }, { Toast: {} }];
            case 'local':
            case 'game':
              return [{ HiveBoard: {} }, { BottomBar: {} }, { Toast: {} }];
            case 'online':
              return [{ HiveBoardOnline: {} }, { BottomBar: {} }, { Toast: {} }];
            default:
              return [{ MainMenu: {} }, { Toast: {} }];
          }
        },
      },
    }),
  };
};

const juris = new Juris({
  components: { App, HiveHexagon, HiveBoard, HiveBoardOnline, BottomBar, PieceInventory, MainMenu, OnlineMenu, InstructionsPage, Toast },
  layout: { App: {} },
  logLevel:'debug'
});

juris.render("#app");
