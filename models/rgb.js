'use strict';

function applyRGB(r, g, b) {
  return [
    Math.max(0, Math.min(255, r)),
    Math.max(0, Math.min(255, g)),
    Math.max(0, Math.min(255, b)),
  ];
}

module.exports = { applyRGB };
