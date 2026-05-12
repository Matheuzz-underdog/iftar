'use strict';

const { idx256toRGB } = require('../utils/ansiUtils');

function applyGrey(r, g, b) {
  const lum = Math.floor((r + g + b) / 3);
  const k   = Math.max(232, Math.min(255, 232 + Math.floor(lum / 10.3)));
  return idx256toRGB(k);
}

module.exports = { applyGrey };
