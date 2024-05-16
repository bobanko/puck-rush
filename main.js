import { createMatrix, deepCopyMatrix, seededRandom } from "./helpers.js";

const rowSize = 3;
const colSize = 3;

const initialEmptyCoords = { row: rowSize - 1, col: Math.floor(colSize / 2) };

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
  //
  none: "none",
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
  shake: [
    [
      { transform: "rotate(-10deg)" },
      {
        transform: "rotate(5deg)",
      },
      {},
    ],
    {
      duration: 300,
      iterations: 1,
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

let seed;
{
  const [hashFlag, hashValue] = location.hash.split("=");
  if (hashFlag === "#seed") {
    seed = hashValue;
  }
}

const random = seededRandom(seed);

function pickRandom(array) {
  const randomIndex = Math.floor(random() * array.length);
  return array[randomIndex];
}

function fillTarget() {
  const mtxTarget = createMatrix({
    rowSize,
    colSize,
    defaultValue: colors.empty,
  });

  const colorValues = Object.values(colors);
  colorValues.pop(); //remove empty color

  for (let row = 0; row < rowSize; row++) {
    for (let col = 0; col < colSize; col++) {
      mtxTarget[row][col] = pickRandom(colorValues);
    }
  }

  //set one empty cell
  mtxTarget[initialEmptyCoords.row][initialEmptyCoords.col] = colors.empty;

  return mtxTarget;
}

function createCells({ mtx, $container, $template }) {
  // create ui based on mtx
  $container.replaceChildren();

  for (let rowIndex = 0; rowIndex < rowSize; rowIndex++) {
    for (let colIndex = 0; colIndex < colSize; colIndex++) {
      const cellFragment = $template.content.cloneNode(true); //fragment
      const $cell = cellFragment.firstElementChild;

      $cell.dataset.col = colIndex;
      $cell.dataset.row = rowIndex;

      $cell.dataset.color = mtx[rowIndex][colIndex];

      $container.appendChild($cell);
    }
  }
}

function createTargetCardCells(mtx) {
  createCells({ mtx, $container: $targetCard, $template: $tmplTargetCardCell });
}

function createGameBoardCells(mtx) {
  createCells({ mtx, $container: $cellGrid, $template: $tmplBoardCell });
}

function checkMoveDirection({ puckPos, emptyPos }) {
  const colDiff = puckPos.col - emptyPos.col;
  const rowDiff = puckPos.row - emptyPos.row;

  // todo(vmyshko): impl 2-at-once move?

  const moveDistance = Math.abs(colDiff) + Math.abs(rowDiff);

  if (moveDistance !== 1) {
    return directions.none;
  }

  // in distance of 1 -- can move
  if (colDiff === 1) {
    return directions.left;
  } else if (colDiff === -1) {
    return directions.right;
  } else if (rowDiff === 1) {
    return directions.up;
  } else if (rowDiff === -1) {
    return directions.down;
  }
}

function getPossibleMoves({ emptyPos }) {
  const possibleMoves = [];

  for (let row = 0; row < rowSize; row++) {
    for (let col = 0; col < colSize; col++) {
      const direction = checkMoveDirection({
        puckPos: { row, col },
        emptyPos,
      });

      if (direction === directions.none) continue;

      possibleMoves.push({ row, col, direction: direction });
    }
  }

  return possibleMoves;
}

function swapPucks({ mtx, puckPos, emptyPos }) {
  [
    mtx[puckPos.row][puckPos.col], //
    mtx[emptyPos.row][emptyPos.col],
  ] = [
    mtx[emptyPos.row][emptyPos.col], //
    mtx[puckPos.row][puckPos.col],
  ];
}

function shufflePucks({ mtx, steps = 50 }) {
  const mtxShuffled = deepCopyMatrix(mtx);
  let { row, col } = initialEmptyCoords;

  const emptyPos = { row, col };

  const dirAntagonists = {
    [directions.up]: directions.down,
    [directions.right]: directions.left,
    [directions.down]: directions.up,
    [directions.left]: directions.right,
  };

  let prevDirection = null;

  for (let step = 0; step < steps; step++) {
    const moves = getPossibleMoves({ emptyPos });

    const cleanMoves = moves.filter((move) => {
      // next direction should not be antagonist of prev
      return move.direction !== dirAntagonists[prevDirection];
    });

    // random move
    const { col, row, direction } = pickRandom(cleanMoves);

    prevDirection = direction;

    swapPucks({
      mtx: mtxShuffled,
      puckPos: { col, row },
      emptyPos,
    });

    // update empty pos
    emptyPos.col = col;
    emptyPos.row = row;
  }

  return mtxShuffled;
}

function initGame() {
  const mtxTarget = fillTarget();
  createTargetCardCells(mtxTarget);

  const mtxPucks = deepCopyMatrix(mtxTarget);
  // todo(vmyshko): shuffle

  const mtxPucksShuffled = shufflePucks({ mtx: mtxPucks });

  console.log(mtxPucksShuffled);

  createGameBoardCells(mtxPucksShuffled);
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

    $targetCard.animate(...animations.shake);
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

  const direction = checkMoveDirection({
    puckPos: getCellPosition($currentCell),
    emptyPos: getCellPosition($emptyCell),
  });

  if (direction === directions.none) {
    // can't move

    $currentCell.animate(...animations.press);
    clickInProgress = false; // todo(vmyshko): make moving queue instead
  } else {
    moveCell($currentCell, direction);
  }
}
