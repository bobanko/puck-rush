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

const animations = {
  press: [
    [
      {},
      {
        transform: "scale(0.9)",
      },
      {},
    ],
    {
      duration: 200,
      iterations: 1,
      easing: "ease-in-out",
    },
  ],
};

function moveCell($cell, direction = null, duration = 300) {
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
        { transform: "scale(0.9)" },
        animDirections[direction],
      ],
      {
        duration,
        iterations: 1,
        // fill: "both",
        easing: "ease-in-out",
      }
    )
    .addEventListener("finish", () => {
      console.log("anim finished");
      // todo(vmyshko): callback?

      swapCellColors($cell, getEmptyCell());
      clickInProgress = false;
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

function createGameBoardCells(colorsUsed) {
  // create cells
  $cellGrid.replaceChildren();

  const colorsToUse = colorsUsed.slice();

  for (let rowIndex = 0; rowIndex < rowSize; rowIndex++) {
    for (let colIndex = 0; colIndex < colSize; colIndex++) {
      const cellFragment = $tmplBoardCell.content.cloneNode(true); //fragment
      const $cell = cellFragment.firstElementChild;

      $cell.dataset.col = colIndex;
      $cell.dataset.row = rowIndex;

      $cell.dataset.color = colorsToUse.shift();

      $cellGrid.appendChild($cell);
    }
  }
}

function pickRandom(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

function createTargetCardCells() {
  // create cells
  $targetCard.replaceChildren();

  const colorValues = Object.values(colors);
  colorValues.pop(); //remove empty color

  const colorsToUse = [colors.empty];

  for (let iteration = 0; iteration < rowSize * colSize - 1; iteration++) {
    const randomColor = pickRandom(colorValues);

    colorsToUse.push(randomColor);
  }

  const colorsUsed = colorsToUse.slice();
  for (let rowIndex = 0; rowIndex < rowSize; rowIndex++) {
    for (let colIndex = 0; colIndex < colSize; colIndex++) {
      const cellFragment = $tmplTargetCardCell.content.cloneNode(true); //fragment
      const $cell = cellFragment.firstElementChild;

      $cell.dataset.col = colIndex;
      $cell.dataset.row = rowIndex;

      $cell.dataset.color = colorsToUse.pop();

      $targetCard.appendChild($cell);
    }
  }

  return colorsUsed;
}

function initGame() {
  const colorsUsed = createTargetCardCells();
  createGameBoardCells(colorsUsed);
}

initGame();

function checkWin() {
  const targetCells = [...$targetCard.children];
  const gridCells = [...$cellGrid.children];

  const wrongCells = [];
  for (let cellIndex = 0; cellIndex < targetCells.length; cellIndex++) {
    const $targetCell = targetCells[cellIndex];
    const $gridCell = gridCells[cellIndex];

    if ($targetCell.dataset.color !== $gridCell.dataset.color) {
      wrongCells.push($gridCell);
    }
  }

  return { isWin: wrongCells.length === 0, wrongCells };
}

// sub to events
$cellGrid.addEventListener("mousedown", handleClickEvent);
$cellGrid.addEventListener("touchstart", handleClickEvent);

$bell.addEventListener("click", () => {
  const { isWin, wrongCells } = checkWin();

  $bell.animate(...animations.press);

  if (!isWin) {
    console.log("no win");
    wrongCells.forEach(($cell) => {
      $cell.animate(...animations.press);
    });
  } else {
    console.log("🏆 you win");

    // todo(vmyshko): regen

    initGame();
  }
});

// todo(vmyshko): do it better, prevent multiple click while animation in progress
let clickInProgress = false;
function handleClickEvent(event) {
  event.preventDefault(); //prevent both touch and click

  const $currentCell = event.target;
  if (!$currentCell.classList.contains("cell")) return;

  // can't move emptiness
  const $emptyCell = getEmptyCell();
  if ($currentCell === $emptyCell) return;

  if (clickInProgress) return;

  clickInProgress = true;

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
  } else {
    // can't move

    $currentCell.animate(...animations.press);

    clickInProgress = false;
  }

  console.log($currentCell);
}
