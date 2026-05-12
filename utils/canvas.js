'use strict';

const { createCanvas } = require('canvas');

function createCanvasWithFont(width, height, cellSize) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${cellSize}px Consolas, 'Courier New', monospace`;
  ctx.textBaseline = 'top';
  return { canvas, ctx };
}

module.exports = { createCanvasWithFont };
