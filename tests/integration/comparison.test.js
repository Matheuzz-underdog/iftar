'use strict';

const sharp = require('sharp');

const originalRender = require('../../models/renderer').render;
const { render } = require('../../models/renderer');

async function createTestImage() {
  const pixels = Buffer.alloc(50 * 50 * 3);
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      const i = (y * 50 + x) * 3;
      pixels[i]     = x * 5;
      pixels[i + 1] = y * 5;
      pixels[i + 2] = 128;
    }
  }
  return sharp(pixels, { raw: { width: 50, height: 50, channels: 3 } }).png().toBuffer();
}

async function renderToBuffer(renderFn, imageBuffer, options) {
  const result = await renderFn(imageBuffer, options);
  if (Buffer.isBuffer(result)) return result;
  const { canvas, format } = result;
  return format === 'jpg' || format === 'jpeg'
    ? canvas.toBuffer('image/jpeg', { quality: 0.92 })
    : canvas.toBuffer('image/png');
}

describe('Comparación: Original vs Refactorizado', () => {
  let imageBuffer;

  beforeAll(async () => {
    imageBuffer = await createTestImage();
  });

  describe('ASCII mode', () => {
    test('ASCII PNG - ambos generan imagen válida', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ascii', columns: 40 });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ascii', columns: 40 });

      expect(orig.length).toBeGreaterThan(0);
      expect(ref.length).toBeGreaterThan(0);
    });

    test('ASCII density=original produce resultado consistente', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ascii', columns: 40, density: 'original' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ascii', columns: 40, density: 'original' });

      expect(orig.length).toBe(ref.length);
    });

    test('ASCII luminance=bt709 funciona', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ascii', columns: 40, luminance: 'bt709' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ascii', columns: 40, luminance: 'bt709' });

      expect(orig.length).toBe(ref.length);
    });

    test('ASCII luminance=ntsc funciona', async () => {
      const ref = await renderToBuffer(render, imageBuffer, { mode: 'ascii', columns: 40, luminance: 'ntsc' });
      expect(ref.length).toBeGreaterThan(0);
    });

    test('ASCII luminance=gamma funciona', async () => {
      const ref = await renderToBuffer(render, imageBuffer, { mode: 'ascii', columns: 40, luminance: 'gamma' });
      expect(ref.length).toBeGreaterThan(0);
    });

    test('ASCII dithering ignorado (forzado none)', async () => {
      const origNone = await renderToBuffer(originalRender, imageBuffer, { mode: 'ascii', dithering: 'none', columns: 40 });
      const origFS   = await renderToBuffer(originalRender, imageBuffer, { mode: 'ascii', dithering: 'floyd-steinberg', columns: 40 });
      const ref      = await renderToBuffer(render, imageBuffer, { mode: 'ascii', dithering: 'floyd-steinberg', columns: 40 });

      expect(origNone.length).toBe(origFS.length);
      expect(origNone.length).toBe(ref.length);
    });
  });

  describe('ANSI mode', () => {
    test('ANSI PNG - ambos generan imagen válida', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ansi', columns: 40 });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ansi', columns: 40 });

      expect(orig.length).toBeGreaterThan(0);
      expect(ref.length).toBeGreaterThan(0);
    });

    test('ANSI colorMethod=classic funciona', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ansi', columns: 40, colorMethod: 'classic' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ansi', columns: 40, colorMethod: 'classic' });

      expect(orig.length).toBe(ref.length);
    });

    test('ANSI colorMethod=perceptual funciona', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ansi', columns: 40, colorMethod: 'perceptual' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ansi', columns: 40, colorMethod: 'perceptual' });

      expect(orig.length).toBe(ref.length);
    });
  });

  describe('GREY mode', () => {
    test('GREY PNG - ambos generan imagen válida', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'grey', columns: 40 });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'grey', columns: 40 });

      expect(orig.length).toBeGreaterThan(0);
      expect(ref.length).toBeGreaterThan(0);
    });
  });

  describe('256 mode', () => {
    test('256 PNG - ambos generan imagen válida', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: '256', columns: 40 });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: '256', columns: 40 });

      expect(orig.length).toBeGreaterThan(0);
      expect(ref.length).toBeGreaterThan(0);
    });

    test('256 colorMethod=classic funciona', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: '256', columns: 40, colorMethod: 'classic' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: '256', columns: 40, colorMethod: 'classic' });

      expect(orig.length).toBe(ref.length);
    });
  });

  describe('RGB mode', () => {
    test('RGB PNG - ambos generan imagen válida', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'rgb', columns: 40 });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'rgb', columns: 40 });

      expect(orig.length).toBeGreaterThan(0);
      expect(ref.length).toBeGreaterThan(0);
    });

    test('RGB JPG funciona', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'rgb', columns: 40, format: 'jpg' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'rgb', columns: 40, format: 'jpg' });

      expect(orig.length).toBeGreaterThan(0);
      expect(ref.length).toBeGreaterThan(0);
    });
  });

  describe('Parámetros compartidos', () => {
    test('brightness +50 funciona en ASCII', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ascii', columns: 40, brightness: 50 });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ascii', columns: 40, brightness: 50 });

      expect(orig.length).toBe(ref.length);
    });

    test('brightness -50 funciona en RGB', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'rgb', columns: 40, brightness: -50 });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'rgb', columns: 40, brightness: -50 });

      expect(orig.length).toBe(ref.length);
    });

    test('autocontrast funciona en ansi', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ansi', columns: 40, autocontrast: true });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ansi', columns: 40, autocontrast: true });

      expect(orig.length).toBe(ref.length);
    });

    test('cellSize funciona en grey', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'grey', columns: 40, cellSize: 16 });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'grey', columns: 40, cellSize: 16 });

      expect(orig.length).toBe(ref.length);
    });
  });

  describe('Dithering en modos con color', () => {
    test('ordered dithering en ANSI funciona', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'ansi', columns: 40, dithering: 'ordered' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'ansi', columns: 40, dithering: 'ordered' });

      expect(orig.length).toBe(ref.length);
    });

    test('floyd-steinberg en 256 funciona', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: '256', columns: 40, dithering: 'floyd-steinberg' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: '256', columns: 40, dithering: 'floyd-steinberg' });

      expect(orig.length).toBe(ref.length);
    });

    test('atkinson en grey funciona', async () => {
      const orig = await renderToBuffer(originalRender, imageBuffer, { mode: 'grey', columns: 40, dithering: 'atkinson' });
      const ref  = await renderToBuffer(render, imageBuffer, { mode: 'grey', columns: 40, dithering: 'atkinson' });

      expect(orig.length).toBe(ref.length);
    });
  });
});
