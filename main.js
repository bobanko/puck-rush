const rowSize = 3;
const colSize = 3;

const colors = {
  red: "red",
  green: "green",
  blue: "blue",
  yellow: "yellow",
  purple: "purple",
  //
  empty: "empty",
};

const directions = {
  up: "up",
  right: "right",
  down: "down",
  left: "left",
};

function moveCell($cell, direction = null) {
  const animDirections = {
    [directions.up]: {
      transform: "translateY(-100%)",
    },
    [directions.right]: {
      transform: "translateX(100%)",
    },
    [directions.down]: {
      transform: "translateY(100%)",
    },
    [directions.left]: {
      transform: "translateX(-100%)",
    },
  };

  console.log("dir", direction);

  $cell
    .animate(
      [
        {
          transform: "translateX(0%)",
        },
        animDirections[direction],
      ],
      {
        duration: 300,
        iterations: 1,
        // fill: "both",
        easing: "ease-in-out",
      }
    )
    .addEventListener("finish", () => {
      console.log("anim finished");
      // todo(vmyshko): callback?

      swapCellColors($cell, getEmptyCell());
    });
}

function swapCellColors($cell1, $cell2) {
  const { color: color1 } = $cell1.dataset;
  const { color: color2 } = $cell2.dataset;

  $cell1.dataset.color = color2;
  $cell2.dataset.color = color1;
}

function getEmptyCell() {
  const $emptyCell = $cellGrid.querySelector(`[data-color='${colors.empty}']`);

  return $emptyCell;
}

function getCellPosition($cell) {
  const { col, row } = $cell.dataset;

  return { col: +col, row: +row };
}

function createCells() {
  // create cells
  $cellGrid.replaceChildren();

  const colorsToUse = [
    [colors.red, colors.green, colors.blue],
    [colors.yellow, colors.empty, colors.purple],
    [colors.green, colors.yellow, colors.red],
  ];

  for (let rowIndex = 0; rowIndex < rowSize; rowIndex++) {
    for (let colIndex = 0; colIndex < colSize; colIndex++) {
      const cellFragment = $tmplCell.content.cloneNode(true); //fragment
      const $cell = cellFragment.firstElementChild;

      $cell.dataset.col = colIndex;
      $cell.dataset.row = rowIndex;

      $cell.dataset.color = colorsToUse[rowIndex][colIndex];

      $cellGrid.appendChild($cell);
    }
  }
}

createCells();

$cellGrid.addEventListener("click", (event) => {
  const $currentCell = event.target;
  if (!$currentCell.classList.contains("cell")) return;

  // can't move emptiness
  const $emptyCell = getEmptyCell();
  if ($currentCell === $emptyCell) return;

  // get positions
  const { col: currentCol, row: currentRow } = getCellPosition($currentCell);
  const { col: emptyCol, row: emptyRow } = getCellPosition($emptyCell);

  // calc if can move

  const colDiff = currentCol - emptyCol;
  const rowDiff = currentRow - emptyRow;
  if (Math.abs(colDiff) + Math.abs(rowDiff) === 1) {
    // in distance of 1 -- can move

    if (colDiff === 1) {
      moveCell($currentCell, directions.left);
    } else if (colDiff === -1) {
      moveCell($currentCell, directions.right);
    } else if (rowDiff === 1) {
      moveCell($currentCell, directions.up);
    } else if (rowDiff === -1) {
      moveCell($currentCell, directions.down);
    }
  }

  console.log($currentCell);
});
