import { createMatrix, deepCopyMatrix, seededRandom } from "./helpers.js";

let rowSize = 3;
let colSize = 3;

let seed;
{
  const [hashFlag, hashValue] = location.hash.split("=");
  if (hashFlag === "#seed") {
    seed = hashValue;
  } else if (hashFlag === "#size") {
    [colSize, rowSize] = hashValue.split("x").map((value) => +value);
  }
}
const random = seededRandom(seed);

{
  const $root = document.querySelector(":root");
  $root.style.setProperty("--colSize", colSize);
  $root.style.setProperty("--rowSize", rowSize);
}

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

function animateMoveCell({ $cell, direction = null, callback }) {
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
        duration: 200,
        iterations: 1,
        // fill: "both",
        easing: "ease-in-out",
      }
    )
    // todo(vmyshko): replace to promise
    .addEventListener("finish", callback);
}

function getEmptyCell() {
  const $emptyCell = $cellGrid.querySelector(`[data-color='${colors.empty}']`);

  return $emptyCell;
}

function getCellData($cell) {
  const { col, row, color } = $cell.dataset;

  return { col: +col, row: +row, color };
}

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

function createCells({ mtx, $container, $template, callback }) {
  // create ui based on mtx
  $container.replaceChildren();

  for (let rowIndex = 0; rowIndex < rowSize; rowIndex++) {
    for (let colIndex = 0; colIndex < colSize; colIndex++) {
      const cellFragment = $template.content.cloneNode(true); //fragment
      const $cell = cellFragment.firstElementChild;

      $cell.dataset.col = colIndex;
      $cell.dataset.row = rowIndex;

      $cell.dataset.color = mtx[rowIndex][colIndex];

      callback?.({ $cell, colIndex, rowIndex });

      $container.appendChild($cell);
    }
  }
}

function updateCells({ mtx, $container }) {
  const cells = [...$container.children];
  // just update datasets
  for (let rowIndex = 0; rowIndex < rowSize; rowIndex++) {
    for (let colIndex = 0; colIndex < colSize; colIndex++) {
      const $cell = cells.shift();

      // update cell from mtx
      $cell.dataset.col = colIndex;
      $cell.dataset.row = rowIndex;

      $cell.dataset.color = mtx[rowIndex][colIndex];
    }
  }
}

function createTargetCardCells(mtx) {
  const dices = {
    [colors.red]: "./cards/dice-1.svg#img",
    [colors.green]: "./cards/dice-2.svg#img",
    [colors.blue]: "./cards/dice-3.svg#img",
    [colors.yellow]: "./cards/dice-4.svg#img",
    [colors.purple]: "./cards/dice-5.svg#img",
    //?
    [colors.empty]: "./cards/dice-6.svg#img",
  };

  createCells({
    mtx,
    $container: $targetCard,
    $template: $tmplTargetCardCell,
    callback: ({ $cell }) => {
      // todo(vmyshko): apply random img

      const $use = $cell.querySelector("use");

      $use.href.baseVal = dices[$cell.dataset.color];
    },
  });
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

  _emptyPos = emptyPos;

  return mtxShuffled;
}

// todo(vmyshko): move to game.class or smth..
let _mtxTarget = null;
let _mtxPucks = null;
let _emptyPos = null;
function initGame() {
  const mtxTarget = fillTarget();
  _mtxTarget = mtxTarget;

  createTargetCardCells(mtxTarget);

  const mtxPucks = deepCopyMatrix(mtxTarget);
  // todo(vmyshko): shuffle

  const mtxPucksShuffled = shufflePucks({ mtx: mtxPucks });

  _mtxPucks = mtxPucksShuffled;
  console.log("🆕 new level", mtxTarget, mtxPucksShuffled);

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

// todo(vmyshko): click logic:
// register click
// check posibility
// do swap in matrix
// start anim

function handleClickEvent(event) {
  event.preventDefault(); //prevent both touch and click

  const $currentCell = event.target;
  if (!$currentCell.classList.contains("cell")) return;
  // ---------

  const { row, col, color } = getCellData($currentCell);

  // can't move emptiness
  if (color === colors.empty) return;

  const direction = checkMoveDirection({
    puckPos: { row, col },
    emptyPos: _emptyPos,
  });

  if (direction === directions.none) {
    // can't move
    $currentCell.animate(...animations.press);
    return;
  }

  // instant update matrix
  swapPucks({
    mtx: _mtxPucks,
    puckPos: { row, col },
    emptyPos: _emptyPos,
  });

  _emptyPos = { row, col };

  // todo(vmyshko): animate move
  animateMoveCell({
    $cell: $currentCell,
    direction,
    // await
    callback: () => {
      // update ui
      updateCells({ mtx: _mtxPucks, $container: $cellGrid });
    },
  });
}
