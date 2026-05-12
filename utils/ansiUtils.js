'use strict';

const ANSI8 = [
  [0x00, 0x00, 0x00],
  [0xd0, 0x10, 0x10],
  [0x10, 0xe0, 0x10],
  [0xf7, 0xf5, 0x3a],
  [0x10, 0x10, 0xe0],
  [0xfb, 0x3d, 0xf8],
  [0x10, 0xf0, 0xf0],
  [0xf0, 0xf0, 0xf0],
];

function idx256toRGB(idx) {
  if (idx < 8)    return ANSI8[idx];
  if (idx < 16)   return ANSI8[idx - 8].map(v => Math.min(255, v + 60));
  if (idx >= 232) { const v = (idx - 232) * 10 + 8; return [v, v, v]; }
  const i = idx - 16;
  const L = [0, 95, 135, 175, 215, 255];
  return [L[Math.floor(i / 36)], L[Math.floor((i % 36) / 6)], L[i % 6]];
}

const PALETTE_256 = Array.from({ length: 256 }, (_, i) => idx256toRGB(i));

module.exports = { ANSI8, idx256toRGB, PALETTE_256 };
