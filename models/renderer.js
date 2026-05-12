'use strict';

const sharp = require('sharp');
const { createCanvas } = require('canvas');

const { ASCII_PALETTES, selectChar } = require('./ascii');
const { applyAnsi } = require('./ansi');
const { applyGrey } = require('./grey');
const { apply256 } = require('./256');
const { applyRGB } = require('./rgb');
const {
  applyDitheringOrdered,
  propagateFSError,
  propagateAtkinsonError,
} = require('./dithering');

const { LUMINANCE } = require('../utils/luminance');
const { MAX_PIXELS } = require('../utils/constants');

const KERNEL_BY_MODE = {
  ascii: 'mitchell',
  rgb:   'nearest',
  ansi:  'lanczos3',
  grey:  'lanczos3',
  '256': 'lanczos3',
};

async function render(imageBuffer, options = {}) {
  const {
    mode        = 'rgb',
    format      = 'png',
    columns     = 80,
    cellSize    = 8,
    brightness  = 0,
    density     = 'original',
    colorMethod = 'perceptual',
    dithering   = 'none',
    autocontrast = false,
    luminance   = 'bt709',
  } = options;

  const effectiveDithering = mode === 'ascii' ? 'none' : dithering;
  const cellW = cellSize;
  const cellH = cellSize * 2;

  const kernel = KERNEL_BY_MODE[mode] || 'lanczos3';

  let pipeline = sharp(imageBuffer).rotate();
  if (autocontrast) pipeline = pipeline.normalise();

  const { width: srcW, height: srcH } = await pipeline.metadata().catch(() => ({ width: 0, height: 0 }));
  if (srcW * srcH > MAX_PIXELS) {
    throw new Error(`La imagen excede el límite de ${MAX_PIXELS} píxeles (${srcW}x${srcH}=${srcW * srcH}). Reducí columns o el tamaño de la imagen.`);
  }

  const { data, info } = await pipeline
    .resize(columns, null, { fit: 'inside', kernel })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w  = info.width;
  const h  = info.height;
  const nc = info.channels;

  const errorBuffer = (effectiveDithering === 'floyd-steinberg' || effectiveDithering === 'atkinson')
    ? new Float32Array(w * h * 3)
    : null;

  const propagateError = effectiveDithering === 'floyd-steinberg' ? propagateFSError
    : effectiveDithering === 'atkinson'     ? propagateAtkinsonError
    : null;

  const charRows = Math.floor(h / 2);
  const canvas   = createCanvas(w * cellW, charRows * cellH);
  const ctx      = canvas.getContext('2d');

  ctx.fillStyle    = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font         = `bold ${cellH}px Consolas, 'Courier New', monospace`;
  ctx.textBaseline = 'top';

  function px(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return [0, 0, 0];
    const i = (y * w + x) * nc;

    let r = data[i]     + brightness;
    let g = data[i + 1] + brightness;
    let b = data[i + 2] + brightness;

    if (effectiveDithering === 'ordered') {
      r = applyDitheringOrdered(x, y, r);
      g = applyDitheringOrdered(x, y, g);
      b = applyDitheringOrdered(x, y, b);
    } else if (errorBuffer) {
      const ei = (y * w + x) * 3;
      r += errorBuffer[ei];
      g += errorBuffer[ei + 1];
      b += errorBuffer[ei + 2];
    }

    return [
      Math.max(0, Math.min(255, r)),
      Math.max(0, Math.min(255, g)),
      Math.max(0, Math.min(255, b)),
    ];
  }

  for (let y = 0; y < h - 1; y += 2) {
    const rowY = Math.floor(y / 2) * cellH;

    for (let x = 0; x < w; x++) {
      const colX = x * cellW;

      const [r,  g,  b ] = px(x,     y    );
      const [r2, g2, b2] = px(x,     y + 1);
      const [pr, pg, pb] = px(x - 1, y    );
      const [nr, ng, nb] = px(x + 1, y    );

      if (mode === 'ascii') {
        const pal = ASCII_PALETTES[density] || ASCII_PALETTES.original;
        const lumFn = LUMINANCE[luminance] || LUMINANCE.bt709;
        const lum = Math.round(lumFn(r, g, b));
        const idx = Math.min(Math.floor(lum / (255 / pal.length)), pal.length - 1);

        if (propagateError) {
          const quantizedLum = Math.round((idx / (pal.length - 1)) * 255);
          const err = lum - quantizedLum;
          propagateError(errorBuffer, w, h, x, y,
            err * 0.299, err * 0.587, err * 0.114);
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(colX, rowY, cellW, cellH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(pal[idx], colX, rowY);

      } else {
        let applyColor;
        if      (mode === 'ansi') applyColor = (r, g, b) => applyAnsi(r, g, b, colorMethod);
        else if (mode === 'grey') applyColor = (r, g, b) => applyGrey(r, g, b);
        else if (mode === '256')  applyColor = (r, g, b) => apply256(r, g, b, colorMethod);
        else                      applyColor = (r, g, b) => applyRGB(r, g, b);

        const bg   = applyColor(r2,     g2,     b2    );
        const fg   = applyColor(r - 20, g - 20, b - 20);
        const char = selectChar(r, g, b, r2, g2, b2, pr, pg, pb, nr, ng, nb);

        if (propagateError) {
          propagateError(errorBuffer, w, h, x, y,
            r  - fg[0], g  - fg[1], b  - fg[2]);
          propagateError(errorBuffer, w, h, x, y + 1,
            r2 - bg[0], g2 - bg[1], b2 - bg[2]);
        }

        ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
        ctx.fillRect(colX, rowY, cellW, cellH);
        ctx.fillStyle = `rgb(${fg[0]},${fg[1]},${fg[2]})`;
        ctx.fillText(char, colX, rowY);
      }
    }
  }

  return { canvas, format: format === 'jpeg' ? 'jpg' : format };
}

module.exports = { render };
