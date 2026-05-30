'use strict';

jest.mock('../../models/renderer', () => ({
  render: jest.fn(),
}));

const { render } = require('../../models/renderer');
const { renderAscii } = require('../../controllers/ascii');
const { renderAnsi }  = require('../../controllers/ansi');
const { renderGrey }  = require('../../controllers/grey');
const { render256 }  = require('../../controllers/256');
const { renderRgb }  = require('../../controllers/rgb');

function mockReq(buffer, query) {
  return {
    imageBuffer: buffer || Buffer.from('fake'),
    query: query || {},
  };
}

function mockRes() {
  const headers = {};
  const res = {
    statusCode: 200,
    status: jest.fn((code) => { res.statusCode = code; return res; }),
    set: jest.fn((key, val) => { headers[key] = val; return res; }),
    json: jest.fn(),
    end: jest.fn(),
    get headers() { return headers; },
    write: jest.fn(),
    on: jest.fn(),
    pipe: jest.fn(() => ({
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    })),
  };
  return res;
}

function mockNext() {
  return jest.fn();
}

function mockCanvas() {
  const stream = { on: jest.fn(), pipe: jest.fn() };
  return {
    createPNGStream: () => stream,
    createJPEGStream: () => stream,
  };
}

describe('renderAscii', () => {
  beforeEach(() => jest.clearAllMocks());

  test('setea Content-Type PNG y Content-Disposition', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(res.headers['Content-Type']).toBe('image/png');
    expect(res.headers['Content-Disposition']).toContain('ascii.png');
    expect(next).not.toHaveBeenCalled();
  });

  test('setea Content-Type JPEG cuando format es jpg', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'jpg' });

    const req = mockReq(Buffer.from('fake'), { format: 'jpg' });
    const res = mockRes();

    await renderAscii(req, res, mockNext());

    expect(res.headers['Content-Type']).toBe('image/jpeg');
  });

  test('llama a next en error inesperado', async () => {
    render.mockRejectedValue(new Error('Unexpected'));

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('retorna 400 en error de imagen corrupta', async () => {
    render.mockRejectedValue(new Error('Input buffer corrupted'));

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  test('valores default llaman a render con opciones correctas', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), {
      mode: 'ascii', format: 'png', columns: 80, cellSize: 8,
      brightness: 0, autocontrast: false, density: 'detailed',
      luminance: 'bt709', dithering: 'none',
    });
  });

  test('parametros personalizados funcionan', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'jpg' });

    const req = mockReq(Buffer.from('fake'), {
      columns: '120', cellSize: '16', brightness: '-50', format: 'jpg',
      autocontrast: 'true', density: 'detailed', luminance: 'gamma',
    });
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), {
      mode: 'ascii', format: 'jpg', columns: 120, cellSize: 16,
      brightness: -50, autocontrast: true, density: 'detailed',
      luminance: 'gamma', dithering: 'none',
    });
  });

  test('jpeg se normaliza a jpg', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'jpg' });

    const req = mockReq(Buffer.from('fake'), { format: 'jpeg' });
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ format: 'jpg' }));
  });

  test('columns fuera de rango retorna 400', async () => {
    const req = mockReq(Buffer.from('fake'), { columns: '5' });
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('density invalido retorna 400', async () => {
    const req = mockReq(Buffer.from('fake'), { density: 'super' });
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('luminance invalido retorna 400', async () => {
    const req = mockReq(Buffer.from('fake'), { luminance: 'linear' });
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('format invalido retorna 400', async () => {
    const req = mockReq(Buffer.from('fake'), { format: 'webp' });
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('autocontrast invalido retorna 400', async () => {
    const req = mockReq(Buffer.from('fake'), { autocontrast: 'yes' });
    const res = mockRes();
    const next = mockNext();

    await renderAscii(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('renderAnsi', () => {
  beforeEach(() => jest.clearAllMocks());

  test('funciona con defaults', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    req.renderOptions = { mode: 'ansi' };
    const res = mockRes();

    await renderAnsi(req, res, mockNext());

    expect(res.headers['Content-Disposition']).toContain('ansi.png');
  });

  test('valores default llaman a render con opciones correctas', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await renderAnsi(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), {
      mode: 'ansi', format: 'png', columns: 80, cellSize: 8,
      brightness: 0, autocontrast: false, colorMethod: 'perceptual',
      dithering: 'none',
    });
  });

  test('colorMethod classic funciona', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq(Buffer.from('fake'), { colorMethod: 'classic' });
    const res = mockRes();
    const next = mockNext();

    await renderAnsi(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ colorMethod: 'classic' }));
  });

  test('dithering floyd-steinberg funciona', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq(Buffer.from('fake'), { dithering: 'floyd-steinberg' });
    const res = mockRes();
    const next = mockNext();

    await renderAnsi(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ dithering: 'floyd-steinberg' }));
  });

  test('colorMethod invalido retorna 400', async () => {
    const req = mockReq(Buffer.from('fake'), { colorMethod: 'euclidean' });
    const res = mockRes();
    const next = mockNext();

    await renderAnsi(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('dithering invalido retorna 400', async () => {
    const req = mockReq(Buffer.from('fake'), { dithering: 'half' });
    const res = mockRes();
    const next = mockNext();

    await renderAnsi(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('renderGrey', () => {
  beforeEach(() => jest.clearAllMocks());

  test('funciona con defaults', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    req.renderOptions = { mode: 'grey' };
    const res = mockRes();

    await renderGrey(req, res, mockNext());

    expect(res.headers['Content-Disposition']).toContain('grey.png');
  });

  test('valores default llaman a render con opciones correctas', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await renderGrey(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), {
      mode: 'grey', format: 'png', columns: 80, cellSize: 8,
      brightness: 0, autocontrast: false, dithering: 'none',
    });
  });

  test('dithering atkinson funciona', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq(Buffer.from('fake'), { dithering: 'atkinson' });
    const res = mockRes();
    const next = mockNext();

    await renderGrey(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ dithering: 'atkinson' }));
  });
});

describe('render256', () => {
  beforeEach(() => jest.clearAllMocks());

  test('funciona con defaults', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    req.renderOptions = { mode: '256' };
    const res = mockRes();

    await render256(req, res, mockNext());

    expect(res.headers['Content-Disposition']).toContain('256.png');
  });

  test('valores default llaman a render con opciones correctas', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await render256(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), {
      mode: '256', format: 'png', columns: 80, cellSize: 8,
      brightness: 0, autocontrast: false, colorMethod: 'perceptual',
      dithering: 'none',
    });
  });

  test('colorMethod classic funciona', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq(Buffer.from('fake'), { colorMethod: 'classic' });
    const res = mockRes();
    const next = mockNext();

    await render256(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ colorMethod: 'classic' }));
  });

  test('dithering ordered funciona', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq(Buffer.from('fake'), { dithering: 'ordered' });
    const res = mockRes();
    const next = mockNext();

    await render256(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ dithering: 'ordered' }));
  });
});

describe('renderRgb', () => {
  beforeEach(() => jest.clearAllMocks());

  test('funciona con defaults', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    req.renderOptions = { mode: 'rgb' };
    const res = mockRes();

    await renderRgb(req, res, mockNext());

    expect(res.headers['Content-Disposition']).toContain('rgb.png');
  });

  test('valores default llaman a render con opciones correctas', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await renderRgb(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), {
      mode: 'rgb', format: 'png', columns: 80, cellSize: 8,
      brightness: 0, autocontrast: false, dithering: 'none',
    });
  });

  test('dithering floyd-steinberg funciona', async () => {
    const canvas = mockCanvas();
    render.mockResolvedValue({ canvas, format: 'png' });

    const req = mockReq(Buffer.from('fake'), { dithering: 'floyd-steinberg' });
    const res = mockRes();
    const next = mockNext();

    await renderRgb(req, res, next);

    expect(render).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ dithering: 'floyd-steinberg' }));
  });
});
