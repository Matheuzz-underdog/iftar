'use strict';

const { toLinear, toGamma } = require('./luminance');

function rgbToXyz(r, g, b) {
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  let x = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
  let y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750;
  let z = rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041;

  x = x / 0.95047;
  y = y / 1.00000;
  z = z / 1.08883;

  return [x, y, z];
}

function xyzToLab(x, y, z) {
  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return [L, a, b];
}

function rgbToLab(r, g, b) {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

function deltaE00(Lab1, Lab2) {
  const [L1, a1, b1] = Lab1;
  const [L2, a2, b2] = Lab2;

  const kL = 1;
  const kC = 1;
  const kH = 1;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cb = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  const h1pAdjusted = h1p < 0 ? h1p + 360 : h1p;

  const h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
  const h2pAdjusted = h2p < 0 ? h2p + 360 : h2p;

  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;

  let deltahp;
  if (C1p * C2p === 0) {
    deltahp = 0;
  } else if (Math.abs(h2pAdjusted - h1pAdjusted) <= 180) {
    deltahp = h2pAdjusted - h1pAdjusted;
  } else if (h2pAdjusted - h1pAdjusted > 180) {
    deltahp = h2pAdjusted - h1pAdjusted - 360;
  } else {
    deltahp = h2pAdjusted - h1pAdjusted + 360;
  }

  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((deltahp * Math.PI / 180) / 2);

  const Lb = (L1 + L2) / 2;
  const Cpb = (C1p + C2p) / 2;

  let hpBar;
  if (C1p * C2p === 0) {
    hpBar = h1pAdjusted + h2pAdjusted;
  } else if (Math.abs(h1pAdjusted - h2pAdjusted) <= 180) {
    hpBar = (h1pAdjusted + h2pAdjusted) / 2;
  } else if (h1pAdjusted + h2pAdjusted < 360) {
    hpBar = (h1pAdjusted + h2pAdjusted + 360) / 2;
  } else {
    hpBar = (h1pAdjusted + h2pAdjusted - 360) / 2;
  }

  const T = 1
    - 0.17 * Math.cos((hpBar - 30) * Math.PI / 180)
    + 0.24 * Math.cos(2 * hpBar * Math.PI / 180)
    + 0.32 * Math.cos((3 * hpBar + 6) * Math.PI / 180)
    - 0.20 * Math.cos((4 * hpBar - 63) * Math.PI / 180);

  const deltaTheta = 30 * Math.exp(-Math.pow((hpBar - 275) / 25, 2));

  const SL = 1 + (0.015 * Math.pow(Lb - 50, 2)) / Math.sqrt(20 + Math.pow(Lb - 50, 2));
  const SC = 1 + 0.045 * Cpb;
  const SH = 1 + 0.015 * Cpb * T;

  const RC = -2 * Math.sqrt(Math.pow(Cpb, 7) / (Math.pow(Cpb, 7) + Math.pow(25, 7)));

  const RT = RC * Math.sin((2 * deltaTheta) * Math.PI / 180);

  const deltaE = Math.sqrt(
    Math.pow(deltaLp / (kL * SL), 2) +
    Math.pow(deltaCp / (kC * SC), 2) +
    Math.pow(deltaHp / (kH * SH), 2) +
    RT * (deltaCp / (kC * SC)) * (deltaHp / (kH * SH))
  );

  return deltaE;
}

function deltaECMC(Lab1, Lab2, l = 1, c = 1) {
  const [L1, a1, b1] = Lab1;
  const [L2, a2, b2] = Lab2;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const deltaC = C2 - C1;
  const deltaL = L2 - L1;
  const deltaa = a2 - a1;
  const deltab = b2 - b1;

  let deltaH = Math.sqrt(Math.max(0, deltaa * deltaa + deltab * deltab - deltaC * deltaC));
  if (C1 * C2 !== 0) {
    const term = deltaa * deltaC + deltab * deltaC;
    if (term < 0) deltaH = -deltaH;
  }

  const Lb = (L1 + L2) / 2;
  const Cb = (C1 + C2) / 2;

  let H1 = Math.atan2(b1, a1) * 180 / Math.PI;
  H1 = H1 < 0 ? H1 + 360 : H1;
  if (C1 * C1 + b1 * b1 === 0) H1 = 0;

  const F = Math.sqrt(Math.pow(Cb, 4) / (Math.pow(Cb, 4) + 1900));

  const T = 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * Math.PI / 180))
    + 0.1 * Math.cos((H1 + 90) * Math.PI / 180)
    + 0.45 * Math.cos((H1 + 354) * Math.PI / 180)
    - 0.006 * Math.pow(Cb + 5, 1.25);

  const SL = Lb < 16
    ? 0.511
    : (0.040975 * Lb) / (1 + 0.01765 * Lb);

  const SC = (0.0638 * Cb) / (1 + 0.0131 * Cb) + 0.638;

  const SH = (F * T + 2.5 * F) * SC + 0.0338125 * Cb;

  const HCl = (C1 + C2) / 2;
  const Fc = HCl < 0.9
    ? 1
    : 1 + 0.131 * Math.cos((H1 + 254) * Math.PI / 180)
        + 0.03 * Math.max(C1, C2);

  return Math.sqrt(
    Math.pow(deltaL / (l * SL), 2) +
    Math.pow(deltaC / (c * SC), 2) +
    Math.pow(deltaH / (Fc * SH), 2)
  );
}

function distanceClassic(r, g, b, cr, cg, cb) {
  const dr = cr - r;
  const dg = cg - g;
  const db = cb - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function distancePerceptual(r, g, b, cr, cg, cb) {
  const rMean = (cr + r) / 2;
  return Math.sqrt(
    (2 + rMean / 256) * Math.pow(cr - r, 2) +
    4                 * Math.pow(cg - g, 2) +
    (2 + (255 - rMean) / 256) * Math.pow(cb - b, 2)
  );
}

function distanceLab(r, g, b, cr, cg, cb) {
  return deltaE00(rgbToLab(r, g, b), rgbToLab(cr, cg, cb));
}

function distanceCMC(r, g, b, cr, cg, cb) {
  return deltaECMC(rgbToLab(r, g, b), rgbToLab(cr, cg, cb));
}

module.exports = {
  distanceClassic,
  distancePerceptual,
  distanceLab,
  distanceCMC,
  deltaE00,
  deltaECMC,
  rgbToLab,
  rgbToXyz,
};