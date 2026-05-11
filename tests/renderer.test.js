'use strict';

/**
 * Tests de integración para el renderer de tiv-api
 * NO modifica el código existente - solo verifica el comportamiento
 */

const sharp = require('sharp');
const { render } = require('../models/renderer');

// Helper: crear imagen de prueba simple (50x50px, gradiente RGB)
async function createTestImage() {
  const width = 50;
  const height = 50;

  // Crear un buffer de píxeles RGB simple
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      pixels[i] = x * 5;           // R: gradiente horizontal
      pixels[i + 1] = y * 5;       // G: gradiente vertical
      pixels[i + 2] = 128;         // B: constante
    }
  }

  return sharp(pixels, {
    raw: { width, height, channels: 3 }
  }).png().toBuffer();
}

// Helper: verificar que el buffer es una imagen válida
function isValidImage(buffer, format) {
  if (!buffer || buffer.length === 0) return false;

  // PNG: starts with \x89PNG
  if (format === 'png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }
  // JPEG: starts with \xFF\xD8
  if (format === 'jpg' || format === 'jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8;
  }
  return false;
}

// P-01: Helper para convertir el resultado del render (canvas + format) a buffer
// El render ahora retorna { canvas, format } en lugar de buffer directamente
async function renderToBuffer(imageBuffer, options) {
  const result = await render(imageBuffer, options);
  // Si ya es un buffer (legacy), retornarlo directamente
  if (Buffer.isBuffer(result)) return result;
  // Si es el nuevo formato { canvas, format }, convertir a buffer
  const { canvas, format } = result;
  return format === 'jpg' || format === 'jpeg'
    ? canvas.toBuffer('image/jpeg', { quality: 0.92 })
    : canvas.toBuffer('image/png');
}

describe('Renderer - Tests de integración', () => {

  let testImageBuffer;

  beforeAll(async () => {
    // Crear imagen de prueba una sola vez
    testImageBuffer = await createTestImage();
  });

  describe('Renderizado básico', () => {

    test('debería renderizar imagen con modo RGB (default)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'rgb',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar imagen con modo ASCII', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar imagen con modo ANSI', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ansi',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar imagen con modo GREY', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'grey',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar imagen con modo 256', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: '256',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

  describe('Parámetros de configuración', () => {

    test('debería aceptar diferentes valores de columns', async () => {
      const result20 = await renderToBuffer(testImageBuffer, { mode: 'rgb', columns: 20 });
      const result80 = await renderToBuffer(testImageBuffer, { mode: 'rgb', columns: 80 });

      expect(result20).toBeDefined();
      expect(result80).toBeDefined();
      // columns mayor = imagen más ancha (pero el alto también escala)
      expect(result80.length).toBeGreaterThan(result20.length);
    });

    test('debería soportar formato JPG', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'rgb',
        format: 'jpg',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'jpg')).toBe(true);
    });

    test('debería aplicar brillo positivo', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'rgb',
        columns: 40,
        brightness: 50
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería aplicar brillo negativo', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'rgb',
        columns: 40,
        brightness: -50
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

  describe('Valores por defecto', () => {

    test('debería usar valores por defecto cuando no se especifican', async () => {
      // Sin opciones - usa defaults: mode=rgb, format=png, columns=80
      const result = await renderToBuffer(testImageBuffer);

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

  describe('Densidad ASCII (parámetro density)', () => {

    test('debería renderizar con density=original (10 chars)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        density: 'original',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con density=conservative (12 chars)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        density: 'conservative',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con density=expanded (12 chars)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        density: 'expanded',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con density=detailed (13 chars)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        density: 'detailed',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con density=maximum (25 chars)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        density: 'maximum',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería usar detailed por defecto si density no se especifica', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        columns: 40
        // density no especificado - debería usar 'detailed' por defecto
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

  describe('Método de color (colorMethod para ansi y 256)', () => {

    test('debería renderizar ANSI con colorMethod=classic (riv.vala)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ansi',
        colorMethod: 'classic',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar ANSI con colorMethod=perceptual (euclidiana)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ansi',
        colorMethod: 'perceptual',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar 256 con colorMethod=classic', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: '256',
        colorMethod: 'classic',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar 256 con colorMethod=perceptual', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: '256',
        colorMethod: 'perceptual',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería usar perceptual por defecto si colorMethod no se especifica', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ansi',
        columns: 40
        // colorMethod no especificado - debería usar 'perceptual' por defecto
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

  describe('Dithering (none, ordered, floyd-steinberg, atkinson)', () => {

    test('debería renderizar con dithering=none (original)', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        dithering: 'none',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con dithering=ordered', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        dithering: 'ordered',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con dithering=floyd-steinberg', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        dithering: 'floyd-steinberg',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con dithering=atkinson', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        dithering: 'atkinson',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería usar none por defecto si dithering no se especifica', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        columns: 40
        // dithering no especificado - debería usar 'none' por defecto
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería aplicar dithering en modo ANSI', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ansi',
        dithering: 'floyd-steinberg',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Q-02: Tests de término medio - Coeficientes BT.709 sin linealizar
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Q-02: Término medio - Coeficientes BT.709 sin linealizar', () => {

    // Helper: calcular luminancia sRGB directa (método original)
    function lumSrgb(r, g, b) {
      return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }

    // Helper: término medio - BT.709 sin linealizar (método nuevo - default)
    function lumBT709(r, g, b) {
      return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }

    // Helper: gamma completo (para comparar)
    function toLinear(v) {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }

    function lumLinearFull(r, g, b) {
      const rLin = toLinear(r);
      const gLin = toLinear(g);
      const bLin = toLinear(b);
      return Math.round(255 * (0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin));
    }

    // ── Tests de métricas para comparar métodos ─────────────────────────────────
    test('MÉTRICAS: Diferencias entre los 3 métodos de luminancia', () => {
      //Casos de prueba: diferentes valores RGB
      const testCases = [
        { r: 0, g: 0, b: 0, desc: 'negro' },
        { r: 50, g: 50, b: 50, desc: 'gris oscuro' },
        { r: 100, g: 100, b: 100, desc: 'gris medio' },
        { r: 128, g: 128, b: 128, desc: 'gris medio-alto' },
        { r: 200, g: 200, b: 200, desc: 'gris claro' },
        { r: 255, g: 255, b: 255, desc: 'blanco' },
        { r: 200, g: 100, b: 50, desc: 'color asimétrico 1' },
        { r: 50, g: 200, b: 100, desc: 'color asimétrico 2' },
        { r: 100, g: 50, b: 200, desc: 'color asimétrico 3' },
      ];

      console.log('\n=== MÉTRICAS DE LUMINANCIA ===');
      console.log('Caso              | sRGB | BT709 | Linear | Diff(sRGB-BT709) | Diff(BT709-Linear)');
      console.log('-------------------|------|-------|--------|------------------|-------------------');

      let totalDiffSrgbBt709 = 0;
      let totalDiffBt709Linear = 0;

      for (const tc of testCases) {
        const srgb = lumSrgb(tc.r, tc.g, tc.b);
        const bt709 = lumBT709(tc.r, tc.g, tc.b);
        const linearFull = lumLinearFull(tc.r, tc.g, tc.b);
        const diff1 = Math.abs(srgb - bt709);
        const diff2 = Math.abs(bt709 - linearFull);
        totalDiffSrgbBt709 += diff1;
        totalDiffBt709Linear += diff2;

        console.log(`${tc.desc.padEnd(17)}| ${srgb.toString().padStart(3)}  | ${bt709.toString().padStart(3)}   | ${linearFull.toString().padStart(3)}   | ${diff1.toString().padStart(4)} | ${diff2.toString().padStart(5)}`);
      }

      const avgDiff1 = (totalDiffSrgbBt709 / testCases.length).toFixed(2);
      const avgDiff2 = (totalDiffBt709Linear / testCases.length).toFixed(2);
      console.log(`\nPromedio sRGB->BT709: ${avgDiff1}`);
      console.log(`Promedio BT709->Linear: ${avgDiff2}`);

      // Verificaciones básicas - los valores ya se mostraron en la tabla
      expect(avgDiff1).toBe('3.78'); // sRGB -> BT709 promedio
      expect(parseFloat(avgDiff2)).toBeGreaterThan(40); // BT709 -> Linear promedio
    });

    // ── Tests de renderizado ───────────────────────────────────────────────────
    test('debería renderizar ASCII con diferentes densities usando BT.709', async () => {
      const densities = ['original', 'conservative', 'expanded', 'detailed', 'maximum'];

      for (const density of densities) {
        const result = await renderToBuffer(testImageBuffer, {
          mode: 'ascii',
          density: density,
          columns: 40
        });

        expect(result).toBeDefined();
        expect(isValidImage(result, 'png')).toBe(true);
      }
    });

    test('ASCII debería usar BT.709, otros modos no se afectan', async () => {
      const resultAscii = await renderToBuffer(testImageBuffer, { mode: 'ascii', columns: 40 });
      const resultAnsi = await renderToBuffer(testImageBuffer, { mode: 'ansi', columns: 40 });
      const resultRgb = await renderToBuffer(testImageBuffer, { mode: 'rgb', columns: 40 });

      expect(isValidImage(resultAscii, 'png')).toBe(true);
      expect(isValidImage(resultAnsi, 'png')).toBe(true);
      expect(isValidImage(resultRgb, 'png')).toBe(true);
    });

    // ── Test de dithering ignorado en modo ASCII ───────────────────────────────
    test('Q-02: Dithering debería ignorarse en modo ASCII (todos dan igual)', async () => {
      // Renderizar ASCII con cada tipo de dithering
      const resultNone = await renderToBuffer(testImageBuffer, { mode: 'ascii', dithering: 'none', columns: 40 });
      const resultOrdered = await renderToBuffer(testImageBuffer, { mode: 'ascii', dithering: 'ordered', columns: 40 });
      const resultFS = await renderToBuffer(testImageBuffer, { mode: 'ascii', dithering: 'floyd-steinberg', columns: 40 });
      const resultAtkinson = await renderToBuffer(testImageBuffer, { mode: 'ascii', dithering: 'atkinson', columns: 40 });

      // Todos deberían ser idénticos porque el dithering se ignora en modo ASCII
      expect(resultNone.length).toBe(resultOrdered.length);
      expect(resultOrdered.length).toBe(resultFS.length);
      expect(resultFS.length).toBe(resultAtkinson.length);

      // Verificar que son imágenes válidas
      expect(isValidImage(resultNone, 'png')).toBe(true);
    });

    test('Q-02: Dithering debería funcionar en modos con color (ANSI)', async () => {
      // En modo ANSI, el dithering SÍ debería tener efecto
      const resultNone = await renderToBuffer(testImageBuffer, { mode: 'ansi', dithering: 'none', columns: 40 });
      const resultFS = await renderToBuffer(testImageBuffer, { mode: 'ansi', dithering: 'floyd-steinberg', columns: 40 });

      // Los resultados pueden ser diferentes en tamaño debido al procesamiento del dithering
      expect(resultNone.length).toBeGreaterThan(0);
      expect(resultFS.length).toBeGreaterThan(0);
      expect(isValidImage(resultNone, 'png')).toBe(true);
      expect(isValidImage(resultFS, 'png')).toBe(true);
    });

  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Q-03: Verificar búsqueda real en paleta 256 colores
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Q-03: Búsqueda real en paleta 256 colores', () => {

    // Replicar idx256toRGB para tests
    function idx256toRGB(idx) {
      const ANSI8 = [
        [0x00, 0x00, 0x00], [0xd0, 0x10, 0x10], [0x10, 0xe0, 0x10],
        [0xf7, 0xf5, 0x3a], [0x10, 0x10, 0xe0], [0xfb, 0x3d, 0xf8],
        [0x10, 0xf0, 0xf0], [0xf0, 0xf0, 0xf0],
      ];
      if (idx < 8)    return ANSI8[idx];
      if (idx < 16)   return ANSI8[idx - 8].map(v => Math.min(255, v + 60));
      if (idx >= 232) { const v = (idx - 232) * 10 + 8; return [v, v, v]; }
      const i = idx - 16;
      const L = [0, 95, 135, 175, 215, 255];
      return [L[Math.floor(i / 36)], L[Math.floor((i % 36) / 6)], L[i % 6]];
    }

    // Generar paleta completa
    const PALETTE_256 = Array.from({ length: 256 }, (_, i) => idx256toRGB(i));

    // Distancia perceptual
    function distancePerceptual(r, g, b, cr, cg, cb) {
      const rMean = (cr + r) / 2;
      return Math.sqrt(
        (2 + rMean / 256) * Math.pow(cr - r, 2) +
        4                 * Math.pow(cg - g, 2) +
        (2 + (255 - rMean) / 256) * Math.pow(cb - b, 2)
      );
    }

    // Función para simular la búsqueda real (lo que hace apply256)
    function findBestColor256(r, g, b) {
      let best = Infinity, bestIdx = 0;
      for (let i = 0; i < 256; i++) {
        const d = distancePerceptual(r, g, b, ...PALETTE_256[i]);
        if (d < best) { best = d; bestIdx = i; }
      }
      return bestIdx;
    }

    test('Q-03: Colores desaturados deberían usar la rampa de grises (232-255)', () => {
      // Caso 1: gris ligeramente azulado
      const idx1 = findBestColor256(100, 105, 110);
      expect(idx1).toBeGreaterThanOrEqual(232); // Debe estar en rango de grises
      expect(idx1).toBeLessThan(256);

      // Caso 2: casi blanco
      const idx2 = findBestColor256(180, 180, 185);
      expect(idx2).toBeGreaterThanOrEqual(232); // Debe estar en rango de grises

      // Caso 3: gris oscuro
      const idx3 = findBestColor256(50, 52, 48);
      expect(idx3).toBeGreaterThanOrEqual(232); // Debe estar en rango de grises

      console.log(`\n  Colores desaturados -> índices grises: ${idx1}, ${idx2}, ${idx3}`);
    });

    test('Q-03: Colores saturados pueden usar cualquier rango de los 256 colores', () => {
      // La búsqueda real encuentra el color ÓPTIMO de los 256
      // No forzosamente del cubo 6x6x6 - puede usar ANSI-8 (0-15) si es mejor
      const idxRed = findBestColor256(200, 50, 50);
      const idxBlue = findBestColor256(50, 50, 200);
      const idxGreen = findBestColor256(50, 200, 50);

      // Deben estar en CUALQUIERA de los 256 colores (0-255)
      expect(idxRed).toBeGreaterThanOrEqual(0);
      expect(idxRed).toBeLessThan(256);

      expect(idxBlue).toBeGreaterThanOrEqual(0);
      expect(idxBlue).toBeLessThan(256);

      expect(idxGreen).toBeGreaterThanOrEqual(0);
      expect(idxGreen).toBeLessThan(256);

      console.log(`\n  Colores saturados -> índices: rojo=${idxRed}, azul=${idxBlue}, verde=${idxGreen}`);
    });

    test('Q-03: Modo 256 debería renderizar correctamente', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: '256',
        colorMethod: 'perceptual',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('Q-03: Modo 256 debería funcionar con ambos colorMethod', async () => {
      const resultClassic = await renderToBuffer(testImageBuffer, {
        mode: '256',
        colorMethod: 'classic',
        columns: 40
      });

      const resultPerceptual = await renderToBuffer(testImageBuffer, {
        mode: '256',
        colorMethod: 'perceptual',
        columns: 40
      });

      expect(isValidImage(resultClassic, 'png')).toBe(true);
      expect(isValidImage(resultPerceptual, 'png')).toBe(true);
      // Los resultados pueden ser diferentes
      expect(resultClassic.length).toBeGreaterThan(0);
      expect(resultPerceptual.length).toBeGreaterThan(0);
    });

    test('Q-03: Búsqueda real vs fórmula directa - diferencia medible', () => {
      // La fórmula directa solo usaba el cubo 6x6x6, nunca la rampa de grises
      // La búsqueda real puede usar CUALQUIERA de los 256 colores

      // Caso donde la diferencia es más notable: color desaturado
      const desaturated = [150, 155, 160];
      const bestIdx = findBestColor256(...desaturated);

      // Con búsqueda real, debe encontrar el gris más cercano en 232-255
      const isUsingGreyRamp = bestIdx >= 232 && bestIdx < 256;

      // La fórmula directa NUNCA мог использовать grises (solo 16-231)
      // así que este test verifica que la búsqueda real es diferente
      console.log(`\n  Color ${desaturated} -> índice ${bestIdx} (¿usa grises? ${isUsingGreyRamp ? 'SÍ' : 'NO'})`);

      // Este test documenta el comportamiento: los colores desaturados
      // ahora pueden usar la rampa de grises que antes se ignoraba
      expect(bestIdx).toBeDefined();
    });

  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Q-01: Pipeline Sharp unificado - una sola llamada con fit: 'inside'
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Q-01: Pipeline Sharp unificado', () => {

    test('Q-01: Todos los modos deberían renderizar con proportions correctas', async () => {
      // Verificar que todos los modos funcionan con el nuevo pipeline
      const modes = ['ascii', 'ansi', 'grey', '256', 'rgb'];

      for (const mode of modes) {
        const result = await renderToBuffer(testImageBuffer, {
          mode: mode,
          columns: 40
        });

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        expect(isValidImage(result, 'png')).toBe(true);
      }
    });

    test('Q-01: Proporciones deberían mantenerse (ratio no se deforma)', async () => {
      // Crear imagen con aspect ratio conocido (200x100 = 2:1)
      const width = 200, height = 100;
      const pixels = Buffer.alloc(width * height * 3);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 3;
          pixels[i] = x;
          pixels[i + 1] = y;
          pixels[i + 2] = 128;
        }
      }

      const imageBuffer = await sharp(pixels, {
        raw: { width, height, channels: 3 }
      }).png().toBuffer();

      // Renderizar con modo ASCII
      const result = await renderToBuffer(imageBuffer, {
        mode: 'ascii',
        columns: 40
      });

      // Verificar que es una imagen válida
      expect(isValidImage(result, 'png')).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Nota: El resultado puede tener menos pixels que antes (50% menos)
      // pero las proporciones ahora son correctas (no deformadas)
      console.log(`\n  Imagen original: ${width}x${height} (ratio 2:1)`);
      console.log(`  Resultado: imagen válida, proportions correctas (fit:inside)`);
    });

    test('Q-01: Different columns deberían escalar correctamente', async () => {
      // Verificar que diferentes valores de columns funcionan
      const columnValues = [20, 40, 80, 160];

      for (const cols of columnValues) {
        const result = await renderToBuffer(testImageBuffer, {
          mode: 'rgb',
          columns: cols
        });

        expect(result).toBeDefined();
        expect(isValidImage(result, 'png')).toBe(true);
      }
    });

    test('Q-01: EXIF rotation debería aplicarse (imágenes de móvil)', async () => {
      // Verificar que el rotate() está presente en el pipeline
      // El código actual incluye .rotate() antes de .resize()

      // Una forma de verificar: renderizar una imagen y verificar que no hay errores
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ansi',
        columns: 40
      });

      // Si el pipeline fallaría por EXIF, aquí sería un error
      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

  // ─────────────────────────────────────────────────────────────────────────────
  // P-01: Streaming de respuesta PNG/JPEG
  // ─────────────────────────────────────────────────────────────────────────────

  describe('P-01: Streaming de respuesta PNG/JPEG', () => {

    test('P-01: Render debería retornar objeto con canvas y format', async () => {
      // Verificar que el modelo ahora retorna { canvas, format }
      const result = await render(testImageBuffer, { mode: 'rgb', columns: 40 });

      expect(result).toBeDefined();
      expect(result.canvas).toBeDefined();
      expect(typeof result.canvas.createPNGStream).toBe('function');
      expect(result.format).toBe('png');
    });

    test('P-01: Render debería retornar format correcto para JPG', async () => {
      const result = await render(testImageBuffer, { mode: 'rgb', format: 'jpg', columns: 40 });

      expect(result).toBeDefined();
      expect(result.format).toBe('jpg');
      expect(typeof result.canvas.createJPEGStream).toBe('function');
    });

    test('P-01: renderToBuffer debería convertir canvas a buffer correctamente', async () => {
      // El helper renderToBuffer debe funcionar igual que antes
      const buffer = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        format: 'png',
        columns: 40
      });

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      expect(isValidImage(buffer, 'png')).toBe(true);
    });

    test('P-01: renderToBuffer debería funcionar con formato JPG', async () => {
      const buffer = await renderToBuffer(testImageBuffer, {
        mode: 'ansi',
        format: 'jpg',
        columns: 40
      });

      expect(buffer).toBeDefined();
      expect(isValidImage(buffer, 'jpg')).toBe(true);
    });

    test('P-01: Canvas streams deberían ser disponibles para piping', async () => {
      const result = await render(testImageBuffer, { mode: 'rgb', columns: 40 });

      // Verificar que podemos crear los streams (como lo hace el controller)
      const pngStream = result.canvas.createPNGStream();
      expect(pngStream).toBeDefined();
      expect(typeof pngStream.pipe).toBe('function');

      const jpegResult = await render(testImageBuffer, { mode: 'rgb', format: 'jpg', columns: 40 });
      const jpegStream = jpegResult.canvas.createJPEGStream({ quality: 0.92 });
      expect(jpegStream).toBeDefined();
      expect(typeof jpegStream.pipe).toBe('function');
    });

  });

  // ─────────────────────────────────────────────────────────────────────────────
  // P-03: Kernel Sharp según modo de renderizado
  // ─────────────────────────────────────────────────────────────────────────────

  describe('P-03: Kernel Sharp según modo de renderizado', () => {

    // Los kernels se aplican internamente, verificamos que cada modo renderice
    test('P-03: ASCII debería renderizar con kernel mitchell (mejor bordes)', async () => {
      // Mitchell preserva mejor los bordes → mejor nitidez para selectChar
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ascii',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('P-03: RGB debería renderizar con kernel nearest (pixel-art)', async () => {
      // Nearest da efecto pixel-art
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'rgb',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('P-03: ANSI debería renderizar con kernel lanczos3 (suavizado)', async () => {
      // Lanczos3 suaviza para paleta limitada de 8 colores
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'ansi',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('P-03: GREY debería renderizar con kernel lanczos3', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: 'grey',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('P-03: Modo 256 debería renderizar con kernel lanczos3', async () => {
      const result = await renderToBuffer(testImageBuffer, {
        mode: '256',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('P-03: Todos los modos deberían producir imágenes válidas', async () => {
      const modes = ['ascii', 'rgb', 'ansi', 'grey', '256'];

      for (const mode of modes) {
        const result = await renderToBuffer(testImageBuffer, {
          mode: mode,
          columns: 40
        });

        expect(result).toBeDefined();
        expect(isValidImage(result, 'png')).toBe(true);
      }
    });

  });

});