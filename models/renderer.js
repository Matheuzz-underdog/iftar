'use strict';

const sharp        = require('sharp');
const { createCanvas } = require('canvas');

// ── Paletas ASCII por densidad ────────────────────────────────────────────────
const ASCII_PALETTES = {
  original:    ' `.-:+*%$#',          // 10 chars - estilo clásico
  conservative: " .'-:;+=*%$#@",       // 12 chars - Opción B
  expanded:    '$@B%8&WM#*o;:,. ',   // 12 chars - riv-javascript
  detailed:     ' .,-:;+*%#@$',        // 13 chars - Opción D
  maximum:      '$@B%8&WM#*o;:,. -+=<>/|(){}[]?',  // 25 chars - Opción E
};

// ── 1. Paleta ANSI 8 colores (fiel a tiv.vala) ──────────────────────────────
const ANSI8 = [
  [0x00, 0x00, 0x00], // 0 black
  [0xd0, 0x10, 0x10], // 1 red
  [0x10, 0xe0, 0x10], // 2 green
  [0xf7, 0xf5, 0x3a], // 3 yellow
  [0x10, 0x10, 0xe0], // 4 blue
  [0xfb, 0x3d, 0xf8], // 5 pink
  [0x10, 0xf0, 0xf0], // 6 turquoise
  [0xf0, 0xf0, 0xf0], // 7 white
];

// ── 2. Algoritmos de color ───────────────────────────────────────────────────

// Índice ANSI-256 → RGB real (para poder dibujar en canvas)
function idx256toRGB(idx) {
  if (idx < 8)   return ANSI8[idx];
  if (idx < 16)  return ANSI8[idx - 8].map(v => Math.min(255, v + 60));
  if (idx >= 232) {
    const v = (idx - 232) * 10 + 8;
    return [v, v, v];
  }
  const i  = idx - 16;
  const L  = [0, 95, 135, 175, 215, 255];
  return [L[Math.floor(i / 36)], L[Math.floor((i % 36) / 6)], L[i % 6]];
}

// reduce8: busca el color ANSI-8 más cercano por distancia ponderada
// (mismo algoritmo que tiv.vala: POND(x,y) = ABS(x)*y)
function reduce8(r, g, b) {
  if (r < 30 && g < 30 && b < 30) return 0;
  if (r > 200 && g > 200 && b > 200) return 7;
  let best = -1, select = 0;
  for (let i = 0; i < ANSI8.length; i++) {
    const [cr, cg, cb] = ANSI8[i];
    const dist = Math.abs(cr - r) * r
               + Math.abs(cg - g) * g
               + Math.abs(cb - b) * b;
    if (best === -1 || dist < best) { best = dist; select = i; }
  }
  return select;
}

// Modos de color individuales
function applyAnsi(r, g, b) { return ANSI8[reduce8(r, g, b)]; }

function applyGrey(r, g, b) {
  const lum = Math.floor((r + g + b) / 3);
  const k   = Math.max(232, Math.min(255, 232 + Math.floor(lum / 10.3)));
  return idx256toRGB(k);
}

function apply256(r, g, b) {
  const ri = Math.floor(Math.max(0, Math.min(255, r)) / 42.6);
  const gi = Math.floor(Math.max(0, Math.min(255, g)) / 42.6);
  const bi = Math.floor(Math.max(0, Math.min(255, b)) / 42.6);
  return idx256toRGB(16 + ri * 36 + gi * 6 + bi);
}

function applyRGB(r, g, b) {
  return [
    Math.max(0, Math.min(255, r)),
    Math.max(0, Math.min(255, g)),
    Math.max(0, Math.min(255, b)),
  ];
}

// Despachador: aplica el modo correcto a un pixel RGB
function applyColor(mode, r, g, b) {
  switch (mode) {
    case 'ansi': return applyAnsi(r, g, b);
    case 'grey': return applyGrey(r, g, b);
    case '256':  return apply256(r, g, b);
    case 'rgb':
    default:     return applyRGB(r, g, b);
  }
}

// ── 3. selectChar: el corazón del algoritmo tiv ──────────────────────────────
// Recibe el pixel actual (r,g,b), el pixel de abajo (r2,g2,b2),
// el previo (pr,pg,pb) y el siguiente (nr,ng,nb) en la misma fila.
// Cuantiza a 0-7 (>> 5 = /32) y elige el carácter según el contexto de bordes.
function selectChar(r, g, b, r2, g2, b2, pr, pg, pb, nr, ng, nb) {
  const rq  = r  >> 5, gq  = g  >> 5, bq  = b  >> 5;
  const r2q = r2 >> 5, g2q = g2 >> 5, b2q = b2 >> 5;
  const prq = pr >> 5, pgq = pg >> 5, pbq = pb >> 5;
  const nrq = nr >> 5, ngq = ng >> 5, nbq = nb >> 5;

  // Borde diagonal \ : el previo coincide con el de abajo, el actual difiere
  if (prq === r2q && pgq === g2q && pbq === b2q &&
      rq !== prq && gq !== pgq && bq !== pbq) return '\\';

  // Borde vertical | : arriba == abajo, pero los vecinos son distintos
  if (rq === r2q && gq === g2q && bq === b2q &&
      prq !== rq && nrq !== rq) return '|';

  // Borde diagonal / o zona homogénea "
  if (r2q === nrq && g2q === ngq && b2q === nbq) {
    return (rq === r2q && gq === g2q && bq === b2q) ? '"' : '/';
  }

  // Borde horizontal _ o =
  if (prq === nrq && pgq === ngq && pbq === nbq) {
    return (prq === rq && pgq === gq && pbq === bq) ? '_' : '=';
  }

  // Defecto: * si el previo coincide con el de abajo, . en cualquier otro caso
  return prq === r2q ? '*' : '.';
}

// ── 4. render: función pública del modelo ────────────────────────────────────
async function render(imageBuffer, options = {}) {
  const {
    mode       = 'rgb',   // ascii | ansi | grey | 256 | rgb
    format     = 'png',   // png | jpg
    columns    = 80,      // ancho en celdas de caracteres
    cellSize   = 8,       // px por celda (alto = cellSize * 2)
    brightness = 0,       // -255 a 255
    density    = 'detailed',  // ascii: original(10), conservative(12), expanded(12), detailed(13), maximum(25)
  } = options;

  const cellW = cellSize;
  const cellH = cellSize * 2; // cada celda cubre 2 filas de píxeles

  // ── Sharp: escalar imagen ─────────────────────────────────────────────────
  const meta     = await sharp(imageBuffer).metadata();
  const scaledW  = columns;
  // *2 porque tiv procesa 2 filas por celda, necesitamos el doble de alto
  const scaledH  = Math.round((meta.height / meta.width) * columns * 2);

  const { data, info } = await sharp(imageBuffer)
    .resize(scaledW, scaledH, { fit: 'fill', kernel: 'lanczos3' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w  = info.width;
  const h  = info.height;
  const nc = info.channels; // siempre 3 tras removeAlpha()

  // ── Canvas: crear lienzo de salida ────────────────────────────────────────
  const charRows = Math.floor(h / 2);
  const canvas   = createCanvas(w * cellW, charRows * cellH);
  const ctx      = canvas.getContext('2d');

  ctx.fillStyle    = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font         = `bold ${cellH}px monospace`;
  ctx.textBaseline = 'top';

  // Helper: pixel en (x,y) con brightness aplicado
  function px(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return [0, 0, 0];
    const i = (y * w + x) * nc;
    return [
      Math.max(0, Math.min(255, data[i]     + brightness)),
      Math.max(0, Math.min(255, data[i + 1] + brightness)),
      Math.max(0, Math.min(255, data[i + 2] + brightness)),
    ];
  }

  // ── Loop principal: 2 filas de píxeles por celda (fiel a tiv.vala) ───────
  for (let y = 0; y < h - 1; y += 2) {
    const rowY = Math.floor(y / 2) * cellH;

    for (let x = 0; x < w; x++) {
      const colX = x * cellW;

      const [r,  g,  b ] = px(x,     y);      // fila superior (color fg)
      const [r2, g2, b2] = px(x,     y + 1);  // fila inferior (color bg)
      const [pr, pg, pb] = px(x - 1, y);      // vecino izquierdo
      const [nr, ng, nb] = px(x + 1, y);      // vecino derecho

      if (mode === 'ascii') {
        // ASCII puro: luminancia → índice en paleta, sin color
        // ITU-R BT.709 fórmula de luminancia (perceptualmente más precisa)
        // Densidad configurable: original(10), conservative(12), expanded(12), detailed(13), maximum(25)
        const pal = ASCII_PALETTES[density] || ASCII_PALETTES.detailed;
        const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        const idx = Math.min(Math.floor(lum / (255 / pal.length)), pal.length - 1);

        ctx.fillStyle = '#000000';
        ctx.fillRect(colX, rowY, cellW, cellH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(pal[idx], colX, rowY);
      } else {
        // Modos de color: bg = fila inferior, fg = fila superior oscurecida -20
        const bg   = applyColor(mode, r2,      g2,      b2);
        const fg   = applyColor(mode, r - 20,  g - 20,  b - 20);
        const char = selectChar(r, g, b, r2, g2, b2, pr, pg, pb, nr, ng, nb);

        ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
        ctx.fillRect(colX, rowY, cellW, cellH);
        ctx.fillStyle = `rgb(${fg[0]},${fg[1]},${fg[2]})`;
        ctx.fillText(char, colX, rowY);
      }
    }
  }

  // ── Exportar ──────────────────────────────────────────────────────────────
  return (format === 'jpg' || format === 'jpeg')
    ? canvas.toBuffer('image/jpeg', { quality: 0.92 })
    : canvas.toBuffer('image/png');
}

module.exports = { render };