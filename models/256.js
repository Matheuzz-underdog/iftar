'use strict';

const { PALETTE_256 } = require('../utils/ansiUtils');
const { distanceClassic, distancePerceptual } = require('../utils/colorDistance');

const _cache256 = new Map();

function apply256(r, g, b, colorMethod = 'perceptual') {
  const key = `${r >> 2},${g >> 2},${b >> 2},${colorMethod[0]}`;
  if (_cache256.has(key)) return _cache256.get(key);

  const distFn = colorMethod === 'classic' ? distanceClassic : distancePerceptual;
  let best = Infinity, bestIdx = 0;
  for (let i = 0; i < 256; i++) {
    const [cr, cg, cb] = PALETTE_256[i];
    const d = distFn(r, g, b, cr, cg, cb);
    if (d < best) { best = d; bestIdx = i; }
  }
  const result = PALETTE_256[bestIdx];
  _cache256.set(key, result);
  return result;
}

function clearCache() {
  _cache256.clear();
}

module.exports = { apply256, clearCache };
