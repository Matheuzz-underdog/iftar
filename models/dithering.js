'use strict';

const ORDERED_MATRIX = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
];

function applyDitheringOrdered(x, y, value) {
  const threshold = (ORDERED_MATRIX[y % 4][x % 4] / 16.0) - 0.5;
  return Math.max(0, Math.min(255, value + threshold * 32));
}

function propagateFSError(errors, w, h, x, y, errR, errG, errB) {
  const neighbors = [
    [x + 1, y,     7 / 16],
    [x - 1, y + 1, 3 / 16],
    [x,     y + 1, 5 / 16],
    [x + 1, y + 1, 1 / 16],
  ];
  for (const [nx, ny, factor] of neighbors) {
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const i = (ny * w + nx) * 3;
      errors[i]     += errR * factor;
      errors[i + 1] += errG * factor;
      errors[i + 2] += errB * factor;
    }
  }
}

function propagateAtkinsonError(errors, w, h, x, y, errR, errG, errB) {
  const factor = 1 / 8;
  const neighbors = [
    [x + 1, y    ],
    [x + 2, y    ],
    [x - 1, y + 1],
    [x,     y + 1],
    [x + 1, y + 1],
    [x,     y + 2],
  ];
  for (const [nx, ny] of neighbors) {
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const i = (ny * w + nx) * 3;
      errors[i]     += errR * factor;
      errors[i + 1] += errG * factor;
      errors[i + 2] += errB * factor;
    }
  }
}

module.exports = {
  ORDERED_MATRIX,
  applyDitheringOrdered,
  propagateFSError,
  propagateAtkinsonError,
};
