'use strict';

function toLinear(v) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function toGamma(v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function gammaCorrectedLuminance(r, g, b) {
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);
  const lumLinear = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  return Math.round(255 * toGamma(lumLinear));
}

const LUMINANCE = {
  bt709:   (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b,
  ntsc:    (r, g, b) => 0.299  * r + 0.587  * g + 0.114  * b,
  gamma:   (r, g, b) => gammaCorrectedLuminance(r, g, b),
};

module.exports = { toLinear, toGamma, gammaCorrectedLuminance, LUMINANCE };
