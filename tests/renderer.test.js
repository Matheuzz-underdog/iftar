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

describe('Renderer - Tests de integración', () => {

  let testImageBuffer;

  beforeAll(async () => {
    // Crear imagen de prueba una sola vez
    testImageBuffer = await createTestImage();
  });

  describe('Renderizado básico', () => {

    test('debería renderizar imagen con modo RGB (default)', async () => {
      const result = await render(testImageBuffer, {
        mode: 'rgb',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar imagen con modo ASCII', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ascii',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar imagen con modo ANSI', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ansi',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar imagen con modo GREY', async () => {
      const result = await render(testImageBuffer, {
        mode: 'grey',
        format: 'png',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar imagen con modo 256', async () => {
      const result = await render(testImageBuffer, {
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
      const result20 = await render(testImageBuffer, { mode: 'rgb', columns: 20 });
      const result80 = await render(testImageBuffer, { mode: 'rgb', columns: 80 });

      expect(result20).toBeDefined();
      expect(result80).toBeDefined();
      // columns mayor = imagen más ancha (pero el alto también escala)
      expect(result80.length).toBeGreaterThan(result20.length);
    });

    test('debería soportar formato JPG', async () => {
      const result = await render(testImageBuffer, {
        mode: 'rgb',
        format: 'jpg',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'jpg')).toBe(true);
    });

    test('debería aplicar brillo positivo', async () => {
      const result = await render(testImageBuffer, {
        mode: 'rgb',
        columns: 40,
        brightness: 50
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería aplicar brillo negativo', async () => {
      const result = await render(testImageBuffer, {
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
      const result = await render(testImageBuffer);

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

  describe('Densidad ASCII (parámetro density)', () => {

    test('debería renderizar con density=original (10 chars)', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ascii',
        density: 'original',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con density=conservative (12 chars)', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ascii',
        density: 'conservative',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con density=expanded (12 chars)', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ascii',
        density: 'expanded',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con density=detailed (13 chars)', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ascii',
        density: 'detailed',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar con density=maximum (25 chars)', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ascii',
        density: 'maximum',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería usar detailed por defecto si density no se especifica', async () => {
      const result = await render(testImageBuffer, {
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
      const result = await render(testImageBuffer, {
        mode: 'ansi',
        colorMethod: 'classic',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar ANSI con colorMethod=perceptual (euclidiana)', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ansi',
        colorMethod: 'perceptual',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar 256 con colorMethod=classic', async () => {
      const result = await render(testImageBuffer, {
        mode: '256',
        colorMethod: 'classic',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería renderizar 256 con colorMethod=perceptual', async () => {
      const result = await render(testImageBuffer, {
        mode: '256',
        colorMethod: 'perceptual',
        columns: 40
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

    test('debería usar perceptual por defecto si colorMethod no se especifica', async () => {
      const result = await render(testImageBuffer, {
        mode: 'ansi',
        columns: 40
        // colorMethod no especificado - debería usar 'perceptual' por defecto
      });

      expect(result).toBeDefined();
      expect(isValidImage(result, 'png')).toBe(true);
    });

  });

});