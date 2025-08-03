import HiveBoard from "./components/board.js"; 
import HiveBoardOnline from "./components/board-online.js";
import BottomBar from "./components/bottom-bar.js";
import HiveHexagon from "./components/hex.js";
import MainMenu from "./components/menu.js";
import OnlineMenu from "./components/online-menu.js";
import PieceInventory from "./components/piece-inventory.js";
import InstructionsPage from "./components/instructions.js";
import Toast from "./components/toast.js";
import Juris from "./juris/juris.js";

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
