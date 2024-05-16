export { seededRandom } from "./seeded-random.js";

export function createMatrix({ rowSize, colSize, defaultValue = 0 }) {
  return Array(rowSize)
    .fill(null)
    .map(() => Array(colSize).fill(defaultValue));
}

export function deepCopyMatrix(matrix) {
  return matrix.map((row) => [...row]);
}
