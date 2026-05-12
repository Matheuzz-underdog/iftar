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

function mockReq(buffer) {
  return {
    imageBuffer: buffer || Buffer.from('fake'),
    renderOptions: {
      mode: 'ascii', format: 'png', columns: 80, cellSize: 8,
      brightness: 0, autocontrast: false, density: 'original',
      luminance: 'bt709', dithering: 'none',
    },
  };
}

function mockRes() {
  const chunks = [];
  const headers = {};
  const res = {
    statusCode: 200,
    status: jest.fn((code) => { res.statusCode = code; return res; }),
    set: jest.fn((key, val) => { headers[key] = val; return res; }),
    json: jest.fn(),
    end: jest.fn(),
    get headers() { return headers; },
    write: jest.fn((chunk) => { chunks.push(chunk); }),
    on: jest.fn((event, cb) => {
      if (event === 'error') res._emitError = cb;
    }),
    pipe: jest.fn(function(target) {
      const stream = {
        on: jest.fn((e, cb) => { if (e === 'error') stream._err = cb; return stream; }),
        write: jest.fn(),
        end: jest.fn(),
      };
      return stream;
    }),
  };
  return res;
}

function mockNext() {
  return jest.fn();
}

describe('controllers', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('renderAscii', () => {
    test('setea Content-Type PNG y Content-Disposition', async () => {
      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      };
      const mockCanvas = {
        createPNGStream: () => mockStream,
        createJPEGStream: () => mockStream,
      };
      render.mockResolvedValue({ canvas: mockCanvas, format: 'png' });

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await renderAscii(req, res, next);

      expect(res.headers['Content-Type']).toBe('image/png');
      expect(res.headers['Content-Disposition']).toContain('ascii.png');
      expect(next).not.toHaveBeenCalled();
    });

    test('setea Content-Type JPEG cuando format es jpg', async () => {
      const mockStream = { on: jest.fn(), pipe: jest.fn() };
      const mockCanvas = { createPNGStream: () => mockStream, createJPEGStream: () => mockStream };
      render.mockResolvedValue({ canvas: mockCanvas, format: 'jpg' });

      const req = mockReq();
      req.renderOptions.format = 'jpg';
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
  });

  describe('renderAnsi', () => {
    test('funciona con defaults', async () => {
      const mockStream = { on: jest.fn(), pipe: jest.fn() };
      const mockCanvas = { createPNGStream: () => mockStream, createJPEGStream: () => mockStream };
      render.mockResolvedValue({ canvas: mockCanvas, format: 'png' });

      const req = mockReq();
      req.renderOptions.mode = 'ansi';
      const res = mockRes();

      await renderAnsi(req, res, mockNext());

      expect(res.headers['Content-Disposition']).toContain('ansi.png');
    });
  });

  describe('renderGrey', () => {
    test('funciona con defaults', async () => {
      const mockStream = { on: jest.fn(), pipe: jest.fn() };
      const mockCanvas = { createPNGStream: () => mockStream, createJPEGStream: () => mockStream };
      render.mockResolvedValue({ canvas: mockCanvas, format: 'png' });

      const req = mockReq();
      req.renderOptions.mode = 'grey';
      const res = mockRes();

      await renderGrey(req, res, mockNext());

      expect(res.headers['Content-Disposition']).toContain('grey.png');
    });
  });

  describe('render256', () => {
    test('funciona con defaults', async () => {
      const mockStream = { on: jest.fn(), pipe: jest.fn() };
      const mockCanvas = { createPNGStream: () => mockStream, createJPEGStream: () => mockStream };
      render.mockResolvedValue({ canvas: mockCanvas, format: 'png' });

      const req = mockReq();
      req.renderOptions.mode = '256';
      const res = mockRes();

      await render256(req, res, mockNext());

      expect(res.headers['Content-Disposition']).toContain('256.png');
    });
  });

  describe('renderRgb', () => {
    test('funciona con defaults', async () => {
      const mockStream = { on: jest.fn(), pipe: jest.fn() };
      const mockCanvas = { createPNGStream: () => mockStream, createJPEGStream: () => mockStream };
      render.mockResolvedValue({ canvas: mockCanvas, format: 'png' });

      const req = mockReq();
      req.renderOptions.mode = 'rgb';
      const res = mockRes();

      await renderRgb(req, res, mockNext());

      expect(res.headers['Content-Disposition']).toContain('rgb.png');
    });
  });
});
