const PieceInventory = (props, context) => {
  const { 
    pieces = [], 
    player = 'white'
  } = props;
    const { getState, setState } = context;
    const getPieceImage = (pieceType) => {
    if (!pieceType) return null;
    return `../public/${pieceType}.svg`;
  };

  const onSelect = (pieceType) => {
    setState("selectedPieceInventory", pieceType);
  };

  return {
    render: () => ({
      div: {
        className: 'flex flex-wrap gap-2',
        children: ()=>  {
          return getState(`${player}Pieces`, []).map((piece, index) => ({
          div: {
            key: `${piece.type}-${index}`,
            className: ()=>`
              relative cursor-pointer transition-all duration-200 
              ${piece.count === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
            `,
            children: [
              {
                HiveHexagon: {
                                  pieceType: piece.type,
                                  pieceColor: piece.color,
                                  isSelected: getState("selectedPieceInventory", null) === piece.type,
                                  isAvailable: piece.isAvailable || false,
                                  isCapturable: piece.isCapturable || false,
                                  onClick: () => onSelect(piece.type),
                                  size: 50,
                                },
              },
              // Count badge
              {
                div: {
                  className: `
                    absolute -top-1 -right-1 w-5 h-5 rounded-full 
                    bg-blue-500 text-white text-xs flex items-center justify-center
                    ${piece.count === 0 ? 'bg-red-500' : ''}
                  `,
                  text: piece.count.toString()
                }
              },
              // Piece name tooltip
              {
                div: {
                  className: 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none',
                  text: piece.type.charAt(0).toUpperCase() + piece.type.slice(1)
                }
              }
            ]
          }
        }))}
      }
    })
  };
};
export default PieceInventory;