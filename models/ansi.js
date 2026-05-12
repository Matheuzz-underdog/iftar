'use strict';

const { ANSI8 } = require('../utils/ansiUtils');
const { distanceClassic, distancePerceptual } = require('../utils/colorDistance');

function reduce8(r, g, b, colorMethod = 'perceptual') {
  if (r < 30 && g < 30 && b < 30) return 0;
  if (r > 200 && g > 200 && b > 200) return 7;

  const distFn = colorMethod === 'classic' ? distanceClassic : distancePerceptual;
  let best = Infinity, select = 0;
  for (let i = 0; i < ANSI8.length; i++) {
    const [cr, cg, cb] = ANSI8[i];
    const d = distFn(r, g, b, cr, cg, cb);
    if (d < best) { best = d; select = i; }
  }
  return select;
}

function applyAnsi(r, g, b, colorMethod = 'perceptual') {
  return ANSI8[reduce8(r, g, b, colorMethod)];
}

module.exports = { applyAnsi, reduce8 };
