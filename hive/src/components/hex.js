const HiveHexagon = (props, context) => {
  const {
    q,
    r,
    isSelected = false,
    isAvailable = false,
    isCapturable = false,
    pieceType = null, // 'queen', 'beetle', 'grasshopper', 'spider', 'ant', etc.
    pieceColor = "transparent", // 'white' or 'black'
    size = 60,
    onClick = () => {},
  } = props;
  const { getState, setState } = context;

  // Define border colors based on state
  const getBorderColor = () => {
    if (isSelected) return "#22c55e"; // green
    if (isAvailable) return "#eab308"; // yellow
    if (isCapturable) return "#ef4444"; // red
    return "#6b7280"; // gray default
  };

  // Get piece image path (you'd replace these with actual image paths)
  const getPieceImage = () => {
    if (!pieceType) return null;
    return `../public/${pieceType}.svg`;
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
    render: () => ({
      div: {
        className: () =>
          getState("hoveredHex", { r: null, q: null }).r === r &&
          getState("hoveredHex", { r: null, q: null }).q === q
            ? `relative inline-block cursor-pointer transition-transform hover:scale-105`
            : `relative inline-block`,
        style: {
          width: `${size * 2}px`,
          height: `${size * 2}px`,
        },
        onclick: onClick,
        children: () => [
          // SVG Hexagon
          {
            svg: {
              width: size * 2,
              height: size * 2,
              viewBox: `${-size} ${-size} ${size * 2} ${size * 2}`,
              className: "absolute inset-0",
              style: {
                pointerEvents: "none",
              },
              children: () => [
                // Hexagon background
                {
                  path: {
                    style: {
                      pointerEvents: "auto",
                    },
                    d: createHexagonPath(size * 0.8),
                    fill: pieceColor === "white" ? "#ffffff" : "#1f1b1bff",
                    "fill-opacity": () =>
                      pieceColor === "transparent" ? 0.0 : 1,
                    stroke: getBorderColor(),
                    "stroke-width": () =>
                      isSelected || isAvailable || isCapturable ? 3 : 1,
                    onmouseenter: () => setState("hoveredHex", { r, q }),
                    onmouseleave: () =>
                      setState("hoveredHex", { r: null, q: null }),
                    className: "transition-all duration-200",
                  },
                },
              ],
            },
          },
          // Piece image (if any)
          ...(pieceType
            ? [
                {
                  div: {
                    className:
                      "absolute inset-0 flex items-center justify-center",
                    children: [
                      {
                        img: {
                          src: getPieceImage(),
                          alt: `${pieceColor} ${pieceType}`,
                          className: "w-15 h-15 object-contain",
                        },
                      },
                    ],
                  },
                },
              ]
            : []),
        ],
      },
    }),
  };
};
export default HiveHexagon;
