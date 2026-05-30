'use strict';

const request = require('supertest');
const sharp = require('sharp');

const refactorApp = require('../../app');

async function createTestImagePng() {
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

async function createTestImageJpg() {
  const pixels = Buffer.alloc(50 * 50 * 3);
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      const i = (y * 50 + x) * 3;
      pixels[i]     = x * 5;
      pixels[i + 1] = y * 5;
      pixels[i + 2] = 128;
    }
  }
  return sharp(pixels, { raw: { width: 50, height: 50, channels: 3 } }).jpeg().toBuffer();
}

function isPng(buffer) {
  return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
}
function isJpeg(buffer) {
  return buffer[0] === 0xFF && buffer[1] === 0xD8;
}

describe('Integration: ASCII mode', () => {
  let imageBuffer;

  beforeAll(async () => {
    imageBuffer = await createTestImagePng();
  });

  test('POST /api/image/ascii/render responde con imagen PNG', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ascii/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40, density: 'original' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect(res.headers['content-disposition']).toContain('ascii.png');
    expect(isPng(res.body)).toBe(true);
  });

  test('POST /api/image/ascii/render/url responde con imagen', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ascii/render/url')
      .send({ url: 'https://httpbin.org/image/png' })
      .query({ columns: 40, density: 'detailed' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image/);
  });

  test('faltando archivo retorna 400', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ascii/render')
      .query({ columns: 40 });

    expect(res.status).toBe(400);
  });

  test('density invalido retorna 400', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ascii/render')
      .attach('image', imageBuffer, { filename: 'test.png' })
      .query({ density: 'super' });

    expect(res.status).toBe(400);
  });

  test('luminance bt709 funciona', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ascii/render')
      .attach('image', imageBuffer, { filename: 'test.png' })
      .query({ columns: 40, luminance: 'bt709' });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });

  test('luminance ntsc funciona', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ascii/render')
      .attach('image', imageBuffer, { filename: 'test.png' })
      .query({ columns: 40, luminance: 'ntsc' });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });

  test('luminance gamma funciona', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ascii/render')
      .attach('image', imageBuffer, { filename: 'test.png' })
      .query({ columns: 40, luminance: 'gamma' });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });
});

describe('Integration: ANSI mode', () => {
  let imageBuffer;

  beforeAll(async () => {
    imageBuffer = await createTestImagePng();
  });

  test('POST /api/image/ansi/render responde con imagen PNG', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ansi/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40 });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect(isPng(res.body)).toBe(true);
  });

  test('colorMethod classic funciona', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ansi/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40, colorMethod: 'classic' });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });

  test('dithering floyd-steinberg funciona', async () => {
    const res = await request(refactorApp)
      .post('/api/image/ansi/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40, dithering: 'floyd-steinberg' });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });
});

describe('Integration: GREY mode', () => {
  let imageBuffer;

  beforeAll(async () => {
    imageBuffer = await createTestImagePng();
  });

  test('POST /api/image/grey/render responde con imagen PNG', async () => {
    const res = await request(refactorApp)
      .post('/api/image/grey/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40 });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });

  test('dithering atkinson funciona', async () => {
    const res = await request(refactorApp)
      .post('/api/image/grey/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40, dithering: 'atkinson' });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });
});

describe('Integration: 256 mode', () => {
  let imageBuffer;

  beforeAll(async () => {
    imageBuffer = await createTestImagePng();
  });

  test('POST /api/image/256/render responde con imagen PNG', async () => {
    const res = await request(refactorApp)
      .post('/api/image/256/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40 });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });

  test('colorMethod perceptual funciona', async () => {
    const res = await request(refactorApp)
      .post('/api/image/256/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40, colorMethod: 'perceptual' });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });
});

describe('Integration: RGB mode', () => {
  let imageBuffer;

  beforeAll(async () => {
    imageBuffer = await createTestImagePng();
  });

  test('POST /api/image/rgb/render responde con imagen PNG', async () => {
    const res = await request(refactorApp)
      .post('/api/image/rgb/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40 });

    expect(res.status).toBe(200);
    expect(isPng(res.body)).toBe(true);
  });

  test('formato JPG funciona', async () => {
    const res = await request(refactorApp)
      .post('/api/image/rgb/render')
      .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
      .query({ columns: 40, format: 'jpg' });

    expect(res.status).toBe(200);
    expect(isJpeg(res.body)).toBe(true);
  });
});

describe('Formato PNG / JPG en todos los modos', () => {
  let imageBuffer;

  beforeAll(async () => {
    imageBuffer = await createTestImagePng();
  });

  const modes = [
    { name: 'ascii',  path: '/api/image/ascii/render', query: { columns: 30, density: 'original' } },
    { name: 'ansi',   path: '/api/image/ansi/render',  query: { columns: 30 } },
    { name: 'grey',   path: '/api/image/grey/render',  query: { columns: 30 } },
    { name: '256',    path: '/api/image/256/render',   query: { columns: 30 } },
    { name: 'rgb',    path: '/api/image/rgb/render',   query: { columns: 30 } },
  ];

  modes.forEach(({ name, path, query }) => {
    test(`${name} formato PNG`, async () => {
      const res = await request(refactorApp)
        .post(path)
        .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
        .query({ ...query, format: 'png' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/png/);
      expect(isPng(res.body)).toBe(true);
    });

    test(`${name} formato JPG`, async () => {
      const res = await request(refactorApp)
        .post(path)
        .attach('image', imageBuffer, { filename: 'test.png', contentType: 'image/png' })
        .query({ ...query, format: 'jpg' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/jpeg/);
      expect(isJpeg(res.body)).toBe(true);
    });
  });
});

describe('Seguridad: MAX_PIXELS guard', () => {
  test('imagen muy grande retorna error', async () => {
    const img = await sharp(Buffer.alloc(5000 * 5000 * 3), {
      raw: { width: 5000, height: 5000, channels: 3 }
    }).jpeg({ quality: 100 }).toBuffer().catch(() => null);

    if (!img) return;

    const res = await request(refactorApp)
      .post('/api/image/rgb/render')
      .attach('image', img, { filename: 'big.jpg', contentType: 'image/jpeg' })
      .query({ columns: 40 });

    expect(res.status).toBe(400);
    expect(res.body.detail).toContain('excede');
  });
});

describe('Seguridad: magic bytes', () => {
  test('archivo con MIME inválido retorna 400', async () => {
    const fakeBuffer = Buffer.from('这不是图片');

    const res = await request(refactorApp)
      .post('/api/image/rgb/render')
      .attach('image', fakeBuffer, { filename: 'fake.png', contentType: 'image/png' })
      .query({ columns: 40 });

    expect(res.status).toBe(400);
  });
});
