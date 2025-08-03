import HiveBoard from "./components/board.js"; 
import HiveBoardOnline from "./components/board-online.js";
import BottomBar from "./components/bottom-bar.js";
import HiveHexagon from "./components/hex.js";
import MainMenu from "./components/menu.js";
import OnlineMenu from "./components/online-menu.js";
import PieceInventory from "./components/piece-inventory.js";
import InstructionsPage from "./components/instructions.js";
import Toast from "./components/toast.js";
import RestartPopup from "./components/restart-popup.js";
import Juris from "juris";
import HiveHexagonDisplay from "./components/display-hex.js";
console.log("Here");
const App = (props, context) => {
  const { getState, setState } = context;

  return {
    render: () => ({
      div: {
        children: ()=>{
          // Show instructions if flag is set
          if (getState('showInstructions', false)) {
            return [{ InstructionsPage: {} }, { Toast: {} }, { RestartPopup: {} }];
          }
          
          // Check for currentView state first, then fallback to gameMode for compatibility
          const currentView = getState('currentView', getState('gameMode', 'menu'));
          
          switch (currentView) {
            case 'menu':
              return [{ MainMenu: {} }, { Toast: {} }, { RestartPopup: {} }];
            case 'onlineMenu':
              return [{ OnlineMenu: {} }, { Toast: {} }, { RestartPopup: {} }];
            case 'local':
            case 'game':
              return [{ HiveBoard: {} }, { BottomBar: {} }, { Toast: {} }, { RestartPopup: {} }];
            case 'online':
              return [{ HiveBoardOnline: {} }, { BottomBar: {} }, { Toast: {} }, { RestartPopup: {} }];
            default:
              return [{ MainMenu: {} }, { Toast: {} }, { RestartPopup: {} }];
          }
        },
      },
    }),
  };
};

const juris = new Juris({
  components: { App, HiveHexagon, HiveHexagonDisplay, HiveBoard, HiveBoardOnline, BottomBar, PieceInventory, MainMenu, OnlineMenu, InstructionsPage, Toast, RestartPopup },
  layout: { App: {} },
  logLevel:'debug'
});

juris.render("#app");
