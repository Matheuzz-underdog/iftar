'use strict';

const { PALETTE_256 } = require('../utils/ansiUtils');
const { distanceClassic, distancePerceptual, distanceLab, distanceCMC } = require('../utils/colorDistance');

const CACHE_MAX = 8000;
const _cache256 = new Map();

function cacheSet(key, val) {
  if (_cache256.size >= CACHE_MAX) {
    _cache256.delete(_cache256.keys().next().value);
  }
  _cache256.set(key, val);
}

function apply256(r, g, b, colorMethod = 'perceptual') {
  const key = `${r >> 2},${g >> 2},${b >> 2},${colorMethod}`;
  if (_cache256.has(key)) return _cache256.get(key);

  let distFn;
  if      (colorMethod === 'classic')   distFn = distanceClassic;
  else if (colorMethod === 'lab')       distFn = distanceLab;
  else if (colorMethod === 'cmc')       distFn = distanceCMC;
  else                                 distFn = distancePerceptual;
  let best = Infinity, bestIdx = 0;
  for (let i = 0; i < 256; i++) {
    const [cr, cg, cb] = PALETTE_256[i];
    const d = distFn(r, g, b, cr, cg, cb);
    if (d < best) { best = d; bestIdx = i; }
  }
  const result = PALETTE_256[bestIdx];
  cacheSet(key, result);
  return result;
}

function clearCache() {
  _cache256.clear();
}

module.exports = { apply256, clearCache };
