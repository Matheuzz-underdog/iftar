'use strict';

function distanceClassic(r, g, b, cr, cg, cb) {
  return Math.abs(cr - r) * r + Math.abs(cg - g) * g + Math.abs(cb - b) * b;
}

function distancePerceptual(r, g, b, cr, cg, cb) {
  const rMean = (cr + r) / 2;
  return Math.sqrt(
    (2 + rMean / 256) * Math.pow(cr - r, 2) +
    4                 * Math.pow(cg - g, 2) +
    (2 + (255 - rMean) / 256) * Math.pow(cb - b, 2)
  );
}

module.exports = { distanceClassic, distancePerceptual };
