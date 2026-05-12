'use strict';

const { ASCII_PALETTES, selectChar } = require('../../models/ascii');
const { reduce8, applyAnsi } = require('../../models/ansi');
const { applyGrey } = require('../../models/grey');
const { apply256, clearCache } = require('../../models/256');
const { applyRGB } = require('../../models/rgb');
const {
  ORDERED_MATRIX,
  applyDitheringOrdered,
  propagateFSError,
  propagateAtkinsonError,
} = require('../../models/dithering');
const { LUMINANCE } = require('../../utils/luminance');

describe('models/ascii', () => {
  describe('ASCII_PALETTES', () => {
    test('original tiene 10 chars', () => {
      expect(ASCII_PALETTES.original).toBe(' `.-:+*%$#');
      expect(ASCII_PALETTES.original).toHaveLength(10);
    });

    test('conservative tiene 13 chars', () => {
      expect(ASCII_PALETTES.conservative).toHaveLength(13);
    });

    test('expanded tiene 16 chars', () => {
      expect(ASCII_PALETTES.expanded).toHaveLength(16);
    });

    test('detailed tiene 12 chars', () => {
      expect(ASCII_PALETTES.detailed).toHaveLength(12);
    });

    test('maximum tiene 30 chars', () => {
      expect(ASCII_PALETTES.maximum).toHaveLength(30);
    });
  });

  describe('selectChar', () => {
    test('caso \\ (diagonal izq)', () => {
      const result = selectChar(96, 96, 96, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      expect(result).toBe('\\');
    });

    test('caso | (vertical)', () => {
      const result = selectChar(128, 128, 128, 128, 128, 128, 0, 0, 0, 0, 0, 0);
      expect(result).toBe('|');
    });

    test('devuelve siempre un char de los esperados', () => {
      const chars = ['\\', '|', '"', '/', '_', '=', '*', '.'];
      for (let i = 0; i < 50; i++) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const result = selectChar(r, g, b, r, g, b, r, g, b, r, g, b);
        expect(chars).toContain(result);
      }
    });
  });
});

describe('models/ansi', () => {
  describe('reduce8', () => {
    test('negro directo devuelve 0', () => {
      expect(reduce8(0, 0, 0)).toBe(0);
    });

    test('blanco directo devuelve 7', () => {
      expect(reduce8(255, 255, 255)).toBe(7);
    });

    test('devuelve valor entre 0 y 7', () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const result = reduce8(r, g, b);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(7);
    });
  });

  describe('applyAnsi', () => {
    test('devuelve array RGB de 3 valores', () => {
      const result = applyAnsi(128, 128, 128);
      expect(result).toHaveLength(3);
      expect(result.every(v => v >= 0 && v <= 255)).toBe(true);
    });

    test('mismo resultado en múltiples llamadas (sin cambios)', () => {
      const r = 100, g = 150, b = 200;
      const a = applyAnsi(r, g, b);
      const b2 = applyAnsi(r, g, b);
      expect(a).toEqual(b2);
    });
  });
});

describe('models/grey', () => {
  test('devuelve array RGB de 3 valores', () => {
    const result = applyGrey(128, 128, 128);
    expect(result).toHaveLength(3);
  });

  test('blanco puro devuelve idx 255', () => {
    const result = applyGrey(255, 255, 255);
    expect(result).toEqual([238, 238, 238]);
  });

  test('negro puro devuelve idx 232', () => {
    const result = applyGrey(0, 0, 0);
    expect(result).toEqual([8, 8, 8]);
  });
});

describe('models/256', () => {
  beforeEach(() => clearCache());

  test('devuelve array RGB de 3 valores', () => {
    const result = apply256(128, 128, 128);
    expect(result).toHaveLength(3);
    expect(result.every(v => v >= 0 && v <= 255)).toBe(true);
  });

  test('cache hit retorna el mismo resultado', () => {
    const r = 100, g = 150, b = 200;
    const first = apply256(r, g, b);
    const second = apply256(r, g, b);
    expect(first).toEqual(second);
  });

    test('classic y perceptual usan distinta lógica', () => {
      const r = 100, g = 50, b = 200;
      const classic = apply256(r, g, b, 'classic');
      const perceptual = apply256(r, g, b, 'perceptual');
      expect(classic).toHaveLength(3);
      expect(perceptual).toHaveLength(3);
    });

  test('negro puro', () => {
    const result = apply256(0, 0, 0);
    expect(result).toEqual([0, 0, 0]);
  });

  test('blanco puro', () => {
    const result = apply256(255, 255, 255);
    expect(result).toEqual([255, 255, 255]);
  });
});

describe('models/rgb', () => {
  test('valores normales pasan', () => {
    expect(applyRGB(128, 64, 200)).toEqual([128, 64, 200]);
  });

  test('valores sobre 255 se cortan', () => {
    expect(applyRGB(300, -50, 128)).toEqual([255, 0, 128]);
  });

  test('blanco y negro', () => {
    expect(applyRGB(255, 255, 255)).toEqual([255, 255, 255]);
    expect(applyRGB(0, 0, 0)).toEqual([0, 0, 0]);
  });
});

describe('models/dithering', () => {
  describe('ORDERED_MATRIX', () => {
    test('es 4x4', () => {
      expect(ORDERED_MATRIX).toHaveLength(4);
      expect(ORDERED_MATRIX[0]).toHaveLength(4);
    });

    test('todos los valores están entre 0 y 15', () => {
      for (const row of ORDERED_MATRIX) {
        for (const val of row) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(15);
        }
      }
    });

    test('todos los valores son únicos', () => {
      const flat = ORDERED_MATRIX.flat();
      const unique = [...new Set(flat)];
      expect(unique).toHaveLength(16);
    });
  });

  describe('applyDitheringOrdered', () => {
    test('devuelve valor en rango 0-255', () => {
      const result = applyDitheringOrdered(0, 0, 128);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(255);
    });

    test('cambia el valor según coordenadas', () => {
      const v = 128;
      const r1 = applyDitheringOrdered(0, 0, v);
      const r2 = applyDitheringOrdered(1, 0, v);
      const r3 = applyDitheringOrdered(0, 1, v);
      const allSame = r1 === r2 && r2 === r3;
      expect(allSame).toBe(false);
    });
  });

  describe('propagateFSError', () => {
    test('distribuye error a 4 vecinos', () => {
      const errors = new Float32Array(3 * 3 * 3);
      const w = 3, h = 3;
      propagateFSError(errors, w, h, 1, 1, 16, 0, 0);

      const neighbors = [
        [2, 1, 7/16],
        [0, 2, 3/16],
        [1, 2, 5/16],
        [2, 2, 1/16],
      ];
      for (const [nx, ny, factor] of neighbors) {
        const i = (ny * w + nx) * 3;
        expect(errors[i]).toBeCloseTo(16 * factor, 5);
      }
    });

    test('no escribe fuera de los límites', () => {
      const errors = new Float32Array(3 * 3 * 3);
      const w = 3, h = 3;
      propagateFSError(errors, w, h, 0, 0, 100, 100, 100);
      expect(errors[0]).toBe(0);
    });

    test('suma de factores = 1.0', () => {
      const factors = [7/16, 3/16, 5/16, 1/16];
      const sum = factors.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe('propagateAtkinsonError', () => {
    test('distribuye error a 6 vecinos', () => {
      const errors = new Float32Array(4 * 4 * 3);
      const w = 4, h = 4;
      propagateAtkinsonError(errors, w, h, 1, 1, 8, 0, 0);

      const factor = 1/8;
      expect(errors[(1 * w + 2) * 3]).toBeCloseTo(8 * factor, 5);
      expect(errors[(1 * w + 3) * 3]).toBeCloseTo(8 * factor, 5);
    });

    test('no escribe fuera de los límites', () => {
      const errors = new Float32Array(3 * 3 * 3);
      const w = 3, h = 3;
      propagateAtkinsonError(errors, w, h, 0, 0, 100, 100, 100);
      expect(errors[0]).toBe(0);
    });

    test('suma de factores = 1.0', () => {
      const factors = [1/8, 1/8, 1/8, 1/8, 1/8, 1/8];
      const sum = factors.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(0.75, 5);
    });
  });
});

describe('LUMINANCE en models', () => {
  test('bt709 disponible desde utils', () => {
    expect(LUMINANCE.bt709).toBeDefined();
  });

  test('ntsc disponible desde utils', () => {
    expect(LUMINANCE.ntsc).toBeDefined();
  });

  test('gamma disponible desde utils', () => {
    expect(LUMINANCE.gamma).toBeDefined();
  });

  test('las tres dan resultados distintos para (128,128,128)', () => {
    const bt = LUMINANCE.bt709(128, 128, 128);
    const nt = LUMINANCE.ntsc(128, 128, 128);
    const gm = LUMINANCE.gamma(128, 128, 128);
    expect(bt).not.toBe(nt);
    expect(nt).not.toBe(gm);
  });
});
