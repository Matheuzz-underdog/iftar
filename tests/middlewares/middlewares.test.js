'use strict';

const { validateAscii } = require('../../middlewares/validateAscii');
const { validateAnsi } = require('../../middlewares/validateAnsi');
const { validateGrey } = require('../../middlewares/validateGrey');
const { validate256 } = require('../../middlewares/validate256');
const { validateRgb } = require('../../middlewares/validateRgb');

function mockReq(query = {}) {
  return { query };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return jest.fn();
}

describe('validateAscii', () => {
  test('valores default producen req.renderOptions correcto', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();
    validateAscii(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions).toEqual({
      mode: 'ascii', format: 'png', columns: 80, cellSize: 8,
      brightness: 0, autocontrast: false, density: 'original',
      luminance: 'bt709', dithering: 'none',
    });
  });

  test('parametros personalizados funcionan', () => {
    const req = mockReq({
      columns: '120', cellSize: '16', brightness: '-50', format: 'jpg',
      autocontrast: 'true', density: 'detailed', luminance: 'gamma',
    });
    const res = mockRes();
    const next = mockNext();
    validateAscii(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions).toEqual({
      mode: 'ascii', format: 'jpg', columns: 120, cellSize: 16,
      brightness: -50, autocontrast: true, density: 'detailed',
      luminance: 'gamma', dithering: 'none',
    });
  });

  test('columns fuera de rango retorna 400', () => {
    const req = mockReq({ columns: '5' });
    const res = mockRes();
    const next = mockNext();
    validateAscii(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('density invalido retorna 400', () => {
    const req = mockReq({ density: 'super' });
    const res = mockRes();
    const next = mockNext();
    validateAscii(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('luminance invalido retorna 400', () => {
    const req = mockReq({ luminance: 'linear' });
    const res = mockRes();
    const next = mockNext();
    validateAscii(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('format invalido retorna 400', () => {
    const req = mockReq({ format: 'webp' });
    const res = mockRes();
    const next = mockNext();
    validateAscii(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('autocontrast invalido retorna 400', () => {
    const req = mockReq({ autocontrast: 'yes' });
    const res = mockRes();
    const next = mockNext();
    validateAscii(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('jpeg se normaliza a jpg', () => {
    const req = mockReq({ format: 'jpeg' });
    const res = mockRes();
    const next = mockNext();
    validateAscii(req, res, next);
    expect(req.renderOptions.format).toBe('jpg');
  });
});

describe('validateAnsi', () => {
  test('valores default', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();
    validateAnsi(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions).toEqual({
      mode: 'ansi', format: 'png', columns: 80, cellSize: 8,
      brightness: 0, autocontrast: false, colorMethod: 'perceptual',
      dithering: 'none',
    });
  });

  test('colorMethod classic funciona', () => {
    const req = mockReq({ colorMethod: 'classic' });
    const res = mockRes();
    const next = mockNext();
    validateAnsi(req, res, next);
    expect(req.renderOptions.colorMethod).toBe('classic');
  });

  test('dithering floyd-steinberg funciona', () => {
    const req = mockReq({ dithering: 'floyd-steinberg' });
    const res = mockRes();
    const next = mockNext();
    validateAnsi(req, res, next);
    expect(req.renderOptions.dithering).toBe('floyd-steinberg');
  });

  test('colorMethod invalido retorna 400', () => {
    const req = mockReq({ colorMethod: 'euclidean' });
    const res = mockRes();
    const next = mockNext();
    validateAnsi(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('dithering invalido retorna 400', () => {
    const req = mockReq({ dithering: 'half' });
    const res = mockRes();
    const next = mockNext();
    validateAnsi(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateGrey', () => {
  test('valores default', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();
    validateGrey(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions.mode).toBe('grey');
    expect(req.renderOptions.dithering).toBe('none');
  });

  test('dithering atkinson funciona', () => {
    const req = mockReq({ dithering: 'atkinson' });
    const res = mockRes();
    const next = mockNext();
    validateGrey(req, res, next);
    expect(req.renderOptions.dithering).toBe('atkinson');
  });

  test('no acepta colorMethod (no existe para grey)', () => {
    const req = mockReq({ colorMethod: 'classic' });
    const res = mockRes();
    const next = mockNext();
    validateGrey(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions.colorMethod).toBeUndefined();
  });
});

describe('validate256', () => {
  test('valores default', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();
    validate256(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions.mode).toBe('256');
    expect(req.renderOptions.colorMethod).toBe('perceptual');
  });

  test('colorMethod classic funciona', () => {
    const req = mockReq({ colorMethod: 'classic' });
    const res = mockRes();
    const next = mockNext();
    validate256(req, res, next);
    expect(req.renderOptions.colorMethod).toBe('classic');
  });

  test('dithering ordered funciona', () => {
    const req = mockReq({ dithering: 'ordered' });
    const res = mockRes();
    const next = mockNext();
    validate256(req, res, next);
    expect(req.renderOptions.dithering).toBe('ordered');
  });
});

describe('validateRgb', () => {
  test('valores default', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();
    validateRgb(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions.mode).toBe('rgb');
  });

  test('dithering funciona', () => {
    const req = mockReq({ dithering: 'floyd-steinberg' });
    const res = mockRes();
    const next = mockNext();
    validateRgb(req, res, next);
    expect(req.renderOptions.dithering).toBe('floyd-steinberg');
  });

  test('no acepta colorMethod (no existe para rgb)', () => {
    const req = mockReq({ colorMethod: 'perceptual' });
    const res = mockRes();
    const next = mockNext();
    validateRgb(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions.colorMethod).toBeUndefined();
  });

  test('no acepta density (no existe para rgb)', () => {
    const req = mockReq({ density: 'original' });
    const res = mockRes();
    const next = mockNext();
    validateRgb(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.renderOptions.density).toBeUndefined();
  });
});
