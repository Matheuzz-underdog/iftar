'use strict';

const sharp            = require('sharp');
const { createCanvas } = require('canvas');

// ── Paletas ASCII por densidad ────────────────────────────────────────────────
const ASCII_PALETTES = {
  original:     ' `.-:+*%$#',
  conservative: " .'-:;+=*%$#@",
  expanded:     '$@B%8&WM#*o;:,. ',
  detailed:     ' .,-:;+*%#@$',
  maximum:      '$@B%8&WM#*o;:,. -+=<>/|(){}[]?',
};

// ── 1. Paleta ANSI 8 colores (fiel a tiv.vala) ───────────────────────────────
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

// ── 2. Índice ANSI-256 → RGB ──────────────────────────────────────────────────
function idx256toRGB(idx) {
  if (idx < 8)    return ANSI8[idx];
  if (idx < 16)   return ANSI8[idx - 8].map(v => Math.min(255, v + 60));
  if (idx >= 232) { const v = (idx - 232) * 10 + 8; return [v, v, v]; }
  const i = idx - 16;
  const L = [0, 95, 135, 175, 215, 255];
  return [L[Math.floor(i / 36)], L[Math.floor((i % 36) / 6)], L[i % 6]];
}

// FIX BUG-02: precomputar la paleta completa de 256 colores al cargar el módulo
// (una sola vez; evita recalcular idx256toRGB en cada pixel)
const PALETTE_256 = Array.from({ length: 256 }, (_, i) => idx256toRGB(i));

// Cache para apply256: key cuantizada a 6 bits por canal → resultado de paleta
// Máx ~262k entradas, en la práctica muy pocas; convierte O(256) en O(1) amortizado
const _cache256 = new Map();

// ── 3. Funciones de distancia de color ───────────────────────────────────────

// Distancia ponderada original de riv.vala (classic)
function distanceClassic(r, g, b, cr, cg, cb) {
  return Math.abs(cr - r) * r + Math.abs(cg - g) * g + Math.abs(cb - b) * b;
}

// Distancia Euclidiana perceptual — más precisa para la percepción humana
function distancePerceptual(r, g, b, cr, cg, cb) {
  const rMean = (cr + r) / 2;
  return Math.sqrt(
    (2 + rMean / 256) * Math.pow(cr - r, 2) +
    4                 * Math.pow(cg - g, 2) +
    (2 + (255 - rMean) / 256) * Math.pow(cb - b, 2)
  );
}

// reduce8: color ANSI-8 más cercano al pixel (r,g,b)
function reduce8(r, g, b, colorMethod = 'perceptual') {
  if (r < 30 && g < 30 && b < 30) return 0; // negro directo
  if (r > 200 && g > 200 && b > 200) return 7; // blanco directo

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

function applyGrey(r, g, b) {
  const lum = Math.floor((r + g + b) / 3);
  const k   = Math.max(232, Math.min(255, 232 + Math.floor(lum / 10.3)));
  return idx256toRGB(k);
}

// FIX BUG-02: apply256 ahora busca en los 256 colores completos con colorMethod real.
// Antes: fórmula directa que solo cubría el cubo 6×6×6 (índices 16-231), ignoraba
//        la rampa de grises (232-255) y los 16 básicos, y nunca usaba colorMethod.
// Ahora: búsqueda real con distancia perceptual o classic según el parámetro,
//        con cache por clave cuantizada para amortizar el coste a O(1).
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

function applyRGB(r, g, b) {
  return [
    Math.max(0, Math.min(255, r)),
    Math.max(0, Math.min(255, g)),
    Math.max(0, Math.min(255, b)),
  ];
}

// Despachador: aplica el modo de color correcto a un pixel
function applyColor(mode, r, g, b, colorMethod = 'perceptual') {
  switch (mode) {
    case 'ansi': return applyAnsi(r, g, b, colorMethod);
    case 'grey': return applyGrey(r, g, b);
    case '256':  return apply256(r, g, b, colorMethod);
    case 'rgb':
    default:     return applyRGB(r, g, b);
  }
}

// ── Q-02: Término medio - Coeficientes BT.709 sin linealizar ──────────────────
// Término medio entre sRGB directo (0.299/0.587/0.114) y gamma-corrected completo.
// Usa coeficientes BT.709 que son más precisos perceptualmente,
// pero sin el costo de linealizar cada canal primero.
function getLuminanceBT709(r, g, b) {
  // Coeficientes ITU-R BT.709 (más precisos que NTSC 0.299/0.587/0.114)
  // operando directamente sobre valores sRGB
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ── 4. selectChar: corazón del algoritmo tiv (sin cambios) ───────────────────
// Cuantiza a 0-7 (>> 5) y elige el carácter según el contexto de bordes.
function selectChar(r, g, b, r2, g2, b2, pr, pg, pb, nr, ng, nb) {
  const rq  = r  >> 5, gq  = g  >> 5, bq  = b  >> 5;
  const r2q = r2 >> 5, g2q = g2 >> 5, b2q = b2 >> 5;
  const prq = pr >> 5, pgq = pg >> 5, pbq = pb >> 5;
  const nrq = nr >> 5, ngq = ng >> 5, nbq = nb >> 5;

  if (prq === r2q && pgq === g2q && pbq === b2q &&
      rq  !== prq && gq  !== pgq && bq  !== pbq) return '\\';
  if (rq  === r2q && gq  === g2q && bq  === b2q &&
      prq !== rq  && nrq !== rq)                  return '|';
  if (r2q === nrq && g2q === ngq && b2q === nbq)
    return (rq === r2q && gq === g2q && bq === b2q) ? '"' : '/';
  if (prq === nrq && pgq === ngq && pbq === nbq)
    return (prq === rq  && pgq === gq  && pbq === bq)  ? '_' : '=';
  return prq === r2q ? '*' : '.';
}

// ── 5. Dithering ─────────────────────────────────────────────────────────────

// Matriz Bayer 4×4 para ordered dithering
const ORDERED_MATRIX = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
];

// Ordered dithering (Bayer 4×4).
// FIX: usa coordenadas de PIXEL (x, y), no de celda.
//      El threshold se escala a ±16 (antes era ±127 — demasiado agresivo).
function applyDitheringOrdered(x, y, value) {
  const threshold = (ORDERED_MATRIX[y % 4][x % 4] / 16.0) - 0.5;
  return Math.max(0, Math.min(255, value + threshold * 32));
}

// FIX BUG-01: Propagadores de error RGB correctos para FS y Atkinson.
// Antes: la función propagateFSError usaba un solo canal de luminancia (siempre cero);
//        updateFn se declaraba pero nunca se invocaba.
// Ahora: propagación real por canal RGB independiente.

// Floyd-Steinberg: distribuye el error a 4 vecinos con pesos 7/16, 3/16, 5/16, 1/16
function propagateFSError(errors, w, h, x, y, errR, errG, errB) {
  const neighbors = [
    [x + 1, y,     7 / 16],
    [x - 1, y + 1, 3 / 16],
    [x,     y + 1, 5 / 16],
    [x + 1, y + 1, 1 / 16],
  ];
  for (const [nx, ny, factor] of neighbors) {
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const i = (ny * w + nx) * 3;
      errors[i]     += errR * factor;
      errors[i + 1] += errG * factor;
      errors[i + 2] += errB * factor;
    }
  }
}

// Atkinson: distribuye 1/8 del error a 6 vecinos (más sutil que FS)
function propagateAtkinsonError(errors, w, h, x, y, errR, errG, errB) {
  const factor = 1 / 8;
  const neighbors = [
    [x + 1, y    ],
    [x + 2, y    ],
    [x - 1, y + 1],
    [x,     y + 1],
    [x + 1, y + 1],
    [x,     y + 2],
  ];
  for (const [nx, ny] of neighbors) {
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const i = (ny * w + nx) * 3;
      errors[i]     += errR * factor;
      errors[i + 1] += errG * factor;
      errors[i + 2] += errB * factor;
    }
  }
}

// ── 6. render: función pública del modelo ────────────────────────────────────
async function render(imageBuffer, options = {}) {
  const {
    mode        = 'rgb',
    format      = 'png',
    columns     = 80,
    cellSize    = 8,
    brightness  = 0,
    density     = 'detailed',
    colorMethod = 'perceptual',
    dithering   = 'none',
  } = options;

  // Q-02: En modo ASCII, forzar dithering = 'none' porque
  // el resultado es binario (blanco/negro) y el dithering no tiene sentido
  // (solo corrompería el resultado)
  const effectiveDithering = mode === 'ascii' ? 'none' : dithering;

  const cellW = cellSize;
  const cellH = cellSize * 2; // cada celda cubre 2 filas de píxeles

  // P-03: Kernel Sharp según modo de renderizado.
  // - ASCII: mitchell (mejor preservación de bordes para selectChar)
  // - RGB: nearest (efecto pixel-art)
  // - ANSI/Grey/256: lanczos3 (suavizado para paleta limitada)
  const KERNEL_BY_MODE = {
    ascii: 'mitchell',
    rgb: 'nearest',
    ansi: 'lanczos3',
    grey: 'lanczos3',
    '256': 'lanczos3',
  };
  const kernel = KERNEL_BY_MODE[mode] || 'lanczos3';

  // Q-01: Pipeline Sharp unificado - una sola llamada con fit: 'inside'.
  const { data, info } = await sharp(imageBuffer)
    .rotate()  // Aplica orientación EXIF antes de procesar
    .resize(columns, null, { fit: 'inside', kernel: kernel })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w  = info.width;
  const h  = info.height;
  const nc = info.channels; // siempre 3 tras removeAlpha()

  // Buffer de errores para FS y Atkinson: 3 canales RGB por pixel
  // FIX BUG-01: el buffer ahora se usa correctamente (antes se inicializaba pero
  //             los errores siempre eran 0 por el bug en px())
  // Q-02: usa effectiveDithering (que fuerza 'none' en modo ASCII)
  const errorBuffer = (effectiveDithering === 'floyd-steinberg' || effectiveDithering === 'atkinson')
    ? new Float32Array(w * h * 3) // Float32Array ya inicializa a 0
    : null;

  // Propagador activo según el modo de dithering seleccionado
  const propagateError = effectiveDithering === 'floyd-steinberg' ? propagateFSError
    : effectiveDithering === 'atkinson'     ? propagateAtkinsonError
    : null;

  // ── Canvas de salida ──────────────────────────────────────────────────────
  const charRows = Math.floor(h / 2);
  const canvas   = createCanvas(w * cellW, charRows * cellH);
  const ctx      = canvas.getContext('2d');

  ctx.fillStyle    = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // N-01: Fallback específico para consistencia cross-platform
  // Consolas (Windows) -> Courier New (macOS/Linux) -> monospace (último recurso)
  ctx.font         = `bold ${cellH}px Consolas, 'Courier New', monospace`;
  ctx.textBaseline = 'top';

  // Helper: devuelve el pixel (x,y) con brightness + error acumulado aplicados.
  // FIX BUG-01: la lógica de propagación de error se eliminó de aquí.
  //             px() solo lee y ajusta; la propagación ocurre en el loop principal
  //             DESPUÉS de conocer el color cuantizado real.
  function px(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return [0, 0, 0];
    const i = (y * w + x) * nc;

    let r = data[i]     + brightness;
    let g = data[i + 1] + brightness;
    let b = data[i + 2] + brightness;

    if (effectiveDithering === 'ordered') {
      // FIX: coordenadas de pixel reales (antes se pasaban coordenadas de celda,
      //      mezclando escalas y rompiendo el patrón de la matriz Bayer)
      r = applyDitheringOrdered(x, y, r);
      g = applyDitheringOrdered(x, y, g);
      b = applyDitheringOrdered(x, y, b);
    } else if (errorBuffer) {
      // Sumar el error acumulado de pasos anteriores (FS o Atkinson)
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

  // ── Loop principal: 2 filas de píxeles por celda (fiel a tiv.vala) ────────
  for (let y = 0; y < h - 1; y += 2) {
    const rowY = Math.floor(y / 2) * cellH;

    for (let x = 0; x < w; x++) {
      const colX = x * cellW;

      // Los vecinos se leen con px() para que también incluyan su error acumulado,
      // lo que hace que selectChar detecte bordes sobre valores "reales renderizados"
      const [r,  g,  b ] = px(x,     y    ); // pixel superior (fg)
      const [r2, g2, b2] = px(x,     y + 1); // pixel inferior (bg)
      const [pr, pg, pb] = px(x - 1, y    ); // vecino izquierdo
      const [nr, ng, nb] = px(x + 1, y    ); // vecino derecho

      if (mode === 'ascii') {
        const pal = ASCII_PALETTES[density] || ASCII_PALETTES.detailed;
        // Q-02: Término medio - usar coeficientes BT.709 sin linealizar
        const lum = Math.round(getLuminanceBT709(r, g, b));
        const idx = Math.min(Math.floor(lum / (255 / pal.length)), pal.length - 1);

        // FIX BUG-01: propagar error de cuantización ASCII.
        // El "color cuantizado" equivale a la luminancia del carácter seleccionado.
        // Se distribuye el error proporcional a los canales RGB (luma inversa).
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
        // Modos de color: bg = pixel inferior, fg = pixel superior oscurecido -20
        const bg   = applyColor(mode, r2,     g2,     b2,     colorMethod);
        const fg   = applyColor(mode, r - 20, g - 20, b - 20, colorMethod);
        const char = selectChar(r, g, b, r2, g2, b2, pr, pg, pb, nr, ng, nb);

        // FIX BUG-01: propagar error real de cuantización para modos de color.
        // Error del pixel superior (fg): diferencia entre original y color de paleta
        // Error del pixel inferior (bg): ídem para la fila de abajo
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

  // ── P-01: Exportar ────────────────────────────────────────────────────────
  // Antes: canvas.toBuffer() - mantiene todo en RAM antes de enviar
  // Ahora: retornar canvas + formato para streaming directo al cliente
  // El controller usará canvas.createPNGStream() o createJPEGStream().pipe(res)
  return { canvas, format };
}

module.exports = { render };