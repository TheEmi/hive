import HiveBoard from "./components/board.js";
import BottomBar from "./components/bottom-bar.js";
import HiveHexagon from "./components/hex.js";
import MainMenu from "./components/menu.js";
import PieceInventory from "./components/piece-inventory.js";
import Juris from "./juris/juris.js";

const App = (props, context) => {
  const { getState, setState } = context;

  return {
    render: () => ({
      div: {
        children: ()=>{
          switch (getState('gameMode', 'menu')) {
            case 'menu':
              return [{ MainMenu: {} }];
            case 'local':
              return [{ HiveBoard: {} }, { BottomBar: {} }];
            case 'online':
              return [{ HiveBoard: {} }, { BottomBar: {} }];
          }
        },
      },
    }),
  };
};

const juris = new Juris({
  components: { App, HiveHexagon, HiveBoard, BottomBar, PieceInventory, MainMenu },
  layout: { App: {} },
});

juris.render("#app");
