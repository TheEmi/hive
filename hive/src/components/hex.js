const HiveHexagon = (props, context) => {
  const {
    q,
    r,
    index,
    isSelected = false,
    isCapturable = false,
    pieceType = null, // 'queen', 'beetle', 'grasshopper', 'spider', 'ant', etc.
    pieceColor = "transparent", // 'white' or 'black'
    size = 60,
    onClick = () => {},
  } = props;
  const { getState, setState } = context;

  // Get stack length and pieces
  const getStackInfo = () => {
    const stackedPieces = getState("stackedPieces", {});
    const key = `${q},${r}`;
    const stack = stackedPieces[key] || [];
    return {
      height: stack.length,
      pieces: stack,
    };
  };

  // Define border colors based on state
  const getBorderColor = () => {
    if (isSelected) return "#22c55e"; // green
    if (isAvailable) return "#eab308"; // yellow
    if (isCapturable) return "#ef4444"; // red
    return "#6b7280"; // gray default
  };

  // Get piece image path (you'd replace these with actual image paths)
  const getPieceImage = () => {
    const pieceType = getState(`boardData.${index}.pieceType`, null);
    if (!pieceType) return null;
    return `${pieceType}.svg`;
  };

  // Create hexagon path for SVG
  const createHexagonPath = (size) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(" L ")} Z`;
  };

  
  return {
    render: () => {
      return {
      div: {
        className: ()=>`relative inline-block cursor-pointer transition-transform duration-200 ${
                      getState("hoveredHex", { r: null, q: null }).r === r &&
                      getState("hoveredHex", { r: null, q: null }).q === q
                        ? "scale-110 z-100"
                        : ""}`,
        style: {
          width: `${size * 2}px`,
          height: `${size * 2}px`,
        },
        onclick: onClick,
        ontouchstart: (e) => {
          // Close tooltip when tapping on the hex itself (for mobile)
          if ('ontouchstart' in window && getState(`stackedPieces.${q},${r}`, {}).length <= 1) {
            setState("hoveredHex", { r: null, q: null });
          }
        },
        children: () => [
          // SVG Hexagon with shadow for stacked pieces
          {
            svg: {
              width: size * 2,
              height: size * 2,
              viewBox: `${-size} ${-size} ${size * 2} ${size * 2}`,
              className: () => `absolute inset-0 transition-transform duration-200`,
              style: {
                pointerEvents: "none",
                transform: () =>
                  getState(`stackedPieces.${q},${r}`, {}).length > 1
                    ? `translate(${getState(`stackedPieces.${q},${r}`, {}).length}px, ${-getState(`stackedPieces.${q},${r}`, {}).length}px)`
                    : "none",
              },
              children: () => [
                // Shadow hexagons for stack effect
                ...(getState(`stackedPieces.${q},${r}`, {}).length > 1
                  ? Array.from({ length: getState(`stackedPieces.${q},${r}`, {}).length - 1 }, (_, i) => ({
                      path: {
                        d: createHexagonPath(size * 0.8),
                        fill: "#d1d5db",
                        stroke: "#9ca3af",
                        "stroke-width": 1,
                        style: {
                          transform: `translate(${
                            -2 * (i + 1)
                          }px, ${2 * (i + 1)}px)`,
                        },
                      },
                    }))
                  : []),
                // Main hexagon
                {
                  path: {
                    style: {
                      pointerEvents: "auto",
                    },
                    d: createHexagonPath(size * 0.8),
                    fill: () => getState(`boardData.${index}.pieceColor`, null) === "white" ? "#ffffff" : "#1f1b1bff",
                    "fill-opacity": () =>
                      getState(`boardData.${index}.pieceColor`, "transparent") === "transparent" ? 0.0 : 1,
                    stroke: () => getState(`boardData.${index}.isAvailable`, false) ? "#eab308" : getState("selectedHex",{q:null,r:null}).q === q && getState("selectedHex",{q:null,r:null}).r === r ? "#22c55e" : "#6b7280",
                    "stroke-width": () =>
                      getState("selectedHex",{q:null,r:null}).q === q && getState("selectedHex",{q:null,r:null}).r === r || getState(`boardData.${index}.isAvailable`, false) || isCapturable ? 3 : 1,
                    onmouseenter: () => {
                      // Only set hover on non-touch devices
                      if (!('ontouchstart' in window)) {
                        setState("hoveredHex", { r, q });
                      }
                    },
                    onmouseleave: () => {
                      // Only clear hover on non-touch devices
                      if (!('ontouchstart' in window)) {
                        setState("hoveredHex", { r: null, q: null });
                      }
                    },
                    ontouchstart: (e) => {
                      e.preventDefault();
                      // Toggle hover state on touch
                      const currentHover = getState("hoveredHex", { r: null, q: null });
                      if (currentHover.r === r && currentHover.q === q) {
                        setState("hoveredHex", { r: null, q: null });
                      } else {
                        setState("hoveredHex", { r, q });
                      }
                    },
                    className: "transition-all duration-200",
                  },
                },
              ],
            },
          },
          // Piece image (top piece only)
          ...(getState(`boardData.${index}.pieceType`, null)
            ? [
                {
                  div: {
                    className: () => `absolute inset-0 flex items-center justify-center transition-transform duration-200`,
                    style: ()=>({
                      transform: () =>
                        getState(`stackedPieces.${q},${r}`, {}).length > 1
                          ? `translate(${getState(`stackedPieces.${q},${r}`, {}).length}px, ${-getState(`stackedPieces.${q},${r}`, {}).length}px)`
                          : "none",
                    }),
                    children: [
                      {
                        img: {
                          src: getPieceImage,
                          alt: `${pieceColor} ${getState(`boardData.${index}.pieceType`, null)} ${getState(`stackedPieces.${q},${r}`, {})}`,
                          className: size < 39 ? "w-13 h-13 object-contain" : "w-15 h-15 object-contain",
                        },
                        p: {
                          text: ()=>getState(`stackedPieces.${q},${r}`, {}).length,
                        }
                      },
                    ],
                  },
                },
              ]
            : []),
          // Stack height indicator
          ...(getState(`stackedPieces.${q},${r}`, {}).length > 1
            ? [
                {
                  div: {
                    className: () => `absolute top-0 right-0 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold z-10 transition-transform duration-200`,
                    style: {
                      transform: () => `translate(${getState(`stackedPieces.${q},${r}`, {}).length}px, ${-getState(`stackedPieces.${q},${r}`, {}).length}px)`,
                    },
                    text: () => getState(`stackedPieces.${q},${r}`, {}).length.toString(),
                  },
                },
              ]
            : []),
          // Stack tooltip on hover
          ...(getState(`stackedPieces.${q},${r}`, {}).length > 1
            ? [
                {
                  div: {
                    className: () => `
                  absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                  bg-black text-white text-xs rounded p-3 opacity-0 transition-opacity z-50
                  ${
                    getState("hoveredHex", { r: null, q: null }).r === r &&
                    getState("hoveredHex", { r: null, q: null }).q === q
                      ? "opacity-100"
                      : ""
                  }
                `,
                    children: () => [
                      { 
                        div: { 
                          text: "Stack (bottom to top):", 
                          className: "font-bold mb-2 text-center" 
                        } 
                      },
                      {
                        div: {
                          className: "flex flex-col gap-1",
                          children: () => getState(`stackedPieces.${q},${r}`, {}).map((piece, index) => ({
                            div: {
                              className: "flex items-center gap-2",
                              children: [
                                {
                                  div: {
                                    className: "text-xs w-4",
                                    text: `${index + 1}.`
                                  }
                                },
                                {
                                  HiveHexagonDisplay: {
                                    pieceType: piece.type,
                                    pieceColor: piece.color,
                                    size: 50,
                                    onClick: () => {}
                                  }
                                },
                                {
                                  div: {
                                    className: () => `text-xs ${index === getState(`stackedPieces.${q},${r}`, {}).length - 1 ? 'font-bold text-yellow-300' : 'text-gray-300'}`,
                                    text: () => `${piece.color} ${piece.type}${index === getState(`stackedPieces.${q},${r}`, {}).length - 1 ? ' (top)' : ''}`
                                  }
                                }
                              ]
                            }
                          })).toReversed()
                        }
                      }
                    ],
                  },
                },
              ]
            : []),
        ],
      },
    }},
  };
};
export default HiveHexagon;
