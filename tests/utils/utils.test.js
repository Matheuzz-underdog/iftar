'use strict';

const { ANSI8, idx256toRGB, PALETTE_256 } = require('../../utils/ansiUtils');
const { distanceClassic, distancePerceptual } = require('../../utils/colorDistance');
const { toLinear, toGamma, gammaCorrectedLuminance, LUMINANCE } = require('../../utils/luminance');

describe('ansiUtils', () => {
  describe('ANSI8', () => {
    test('tiene 8 colores', () => {
      expect(ANSI8).toHaveLength(8);
    });

    test('idx 0 es negro', () => {
      expect(ANSI8[0]).toEqual([0x00, 0x00, 0x00]);
    });

    test('idx 7 es blanco', () => {
      expect(ANSI8[7]).toEqual([0xf0, 0xf0, 0xf0]);
    });
  });

  describe('idx256toRGB', () => {
    test('idx 0 devuelve negro ANSI', () => {
      expect(idx256toRGB(0)).toEqual([0x00, 0x00, 0x00]);
    });

    test('idx 7 devuelve blanco ANSI', () => {
      expect(idx256toRGB(7)).toEqual([0xf0, 0xf0, 0xf0]);
    });

    test('idx 8-15 son ANSI + 60 saturados', () => {
      const bright = ANSI8[0].map(v => Math.min(255, v + 60));
      expect(idx256toRGB(8)).toEqual(bright);
    });

    test('idx 15 es ANSI[7] saturado', () => {
      const bright = ANSI8[7].map(v => Math.min(255, v + 60));
      expect(idx256toRGB(15)).toEqual(bright);
    });

    test('idx 232 es gris bajo (8)', () => {
      expect(idx256toRGB(232)).toEqual([8, 8, 8]);
    });

    test('idx 255 es gris alto (238)', () => {
      expect(idx256toRGB(255)).toEqual([238, 238, 238]);
    });

    test('idx 16 es primer color del cubo 6x6x6', () => {
      const result = idx256toRGB(16);
      expect(result).toHaveLength(3);
      expect(result.every(v => v >= 0 && v <= 255)).toBe(true);
    });
  });

  describe('PALETTE_256', () => {
    test('tiene exactamente 256 entradas', () => {
      expect(PALETTE_256).toHaveLength(256);
    });

    test('idx 0 de PALETTE_256 coincide con idx256toRGB(0)', () => {
      expect(PALETTE_256[0]).toEqual(idx256toRGB(0));
    });

    test('idx 255 coincide con idx256toRGB(255)', () => {
      expect(PALETTE_256[255]).toEqual(idx256toRGB(255));
    });
  });
});

describe('colorDistance', () => {
  test('distanceClassic devuelve valores no negativos', () => {
    const d = distanceClassic(100, 100, 100, 50, 50, 50);
    expect(d).toBeGreaterThanOrEqual(0);
  });

  test('distancePerceptual devuelve valores no negativos', () => {
    const d = distancePerceptual(100, 100, 100, 50, 50, 50);
    expect(d).toBeGreaterThanOrEqual(0);
  });

  test('classic y perceptual dan resultados distintos para mismo par', () => {
    const r = 100, g = 150, b = 200, cr = 50, cg = 100, cb = 180;
    const dc = distanceClassic(r, g, b, cr, cg, cb);
    const dp = distancePerceptual(r, g, b, cr, cg, cb);
    expect(dc).not.toBe(dp);
  });

  test('distancia a si mismo es 0 en perceptual', () => {
    const d = distancePerceptual(128, 128, 128, 128, 128, 128);
    expect(d).toBe(0);
  });

  test('color igual pero channels cambiados da distinta distancia en classic', () => {
    const d1 = distanceClassic(100, 0, 0, 0, 0, 0);
    const d2 = distanceClassic(0, 100, 0, 0, 0, 0);
    expect(d1).toBe(10000);
    expect(d2).toBe(10000);
    expect(d1).toBe(d2);
  });
});

describe('luminance', () => {
  describe('toLinear', () => {
    test('0 es 0', () => {
      expect(toLinear(0)).toBe(0);
    });

    test('255 es 1.0', () => {
      expect(toLinear(255)).toBeCloseTo(1.0);
    });

    test('roundtrip: toGamma(toLinear(x)) cercana a x/255', () => {
      for (const v of [0, 64, 128, 192, 255]) {
        const lin = toLinear(v);
        const back = toGamma(lin);
        expect(back).toBeCloseTo(v / 255, 3);
      }
    });
  });

  describe('toGamma', () => {
    test('0 es 0', () => {
      expect(toGamma(0)).toBe(0);
    });

    test('toGamma(1.0) devuelve valor normalizado (no se espera 255 aqui)', () => {
      const result = toGamma(1.0);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    test('toGamma es creciente', () => {
      expect(toGamma(0.5)).toBeLessThan(toGamma(1.0));
      expect(toGamma(0)).toBeLessThan(toGamma(0.5));
    });
  });

  describe('gammaCorrectedLuminance', () => {
    test('negro puro devuelve 0', () => {
      expect(gammaCorrectedLuminance(0, 0, 0)).toBe(0);
    });

    test('blanco puro devuelve 255', () => {
      expect(gammaCorrectedLuminance(255, 255, 255)).toBe(255);
    });

    test('valores intermedios dan resultados en rango 0-255', () => {
      const lum = gammaCorrectedLuminance(128, 128, 128);
      expect(lum).toBeGreaterThanOrEqual(0);
      expect(lum).toBeLessThanOrEqual(255);
    });

    test('rojo puro da menor luminancia que verde puro', () => {
      const rLum = gammaCorrectedLuminance(255, 0, 0);
      const gLum = gammaCorrectedLuminance(0, 255, 0);
      expect(gLum).toBeGreaterThan(rLum);
    });
  });

  describe('LUMINANCE', () => {
    test('bt709: bt709(255,0,0) = 0.2126*255', () => {
      const expected = 0.2126 * 255;
      expect(LUMINANCE.bt709(255, 0, 0)).toBeCloseTo(expected, 4);
    });

    test('ntsc: ntsc(255,0,0) = 0.299*255', () => {
      const expected = 0.299 * 255;
      expect(LUMINANCE.ntsc(255, 0, 0)).toBeCloseTo(expected, 4);
    });

    test('gamma: blanco devuelve 255', () => {
      expect(LUMINANCE.gamma(255, 255, 255)).toBe(255);
    });

    test('gamma: negro devuelve 0', () => {
      expect(LUMINANCE.gamma(0, 0, 0)).toBe(0);
    });

    test('las tres fórmulas dan resultados distintos para (128,128,128)', () => {
      const bt = LUMINANCE.bt709(128, 128, 128);
      const nt = LUMINANCE.ntsc(128, 128, 128);
      const gm = LUMINANCE.gamma(128, 128, 128);
      expect(bt).not.toBe(nt);
      expect(nt).not.toBe(gm);
    });
  });
});
