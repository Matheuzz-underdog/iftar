'use strict';

const { render } = require('../models/renderer');
const {
  parseColumns, parseCellSize, parseBrightness, parseFormat, parseAutocontrast,
} = require('../utils/parseOptions');
const { VALID_DITHERING } = require('../utils/constants');

async function renderGrey(req, res, next) {
  try {
    const {
      columns      = '80',
      cellSize    = '8',
      brightness  = '0',
      format      = 'png',
      autocontrast = 'false',
      dithering   = 'none',
    } = req.query;

    const cols = parseColumns(columns);
    const cell = parseCellSize(cellSize);
    const bright = parseBrightness(brightness);
    const fmt = parseFormat(format);
    const ac = parseAutocontrast(autocontrast);

    const ditheringLower = dithering.toLowerCase();
    if (!VALID_DITHERING.includes(ditheringLower)) {
      throw { status: 400, error: `Dithering inválido: "${dithering}"`, valid: VALID_DITHERING };
    }

    const renderOptions = {
      mode: 'grey',
      format: fmt,
      columns: cols,
      cellSize: cell,
      brightness: bright,
      autocontrast: ac,
      dithering: ditheringLower,
    };

    const { canvas, format: outFormat } = await render(req.imageBuffer, renderOptions);

    res.set('Content-Type', outFormat === 'jpg' ? 'image/jpeg' : 'image/png');
    res.set('Content-Disposition', `inline; filename="grey.${outFormat}"`);

    const stream = outFormat === 'jpg'
      ? canvas.createJPEGStream({ quality: 0.92 })
      : canvas.createPNGStream();

    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al generar la imagen' });
      } else {
        res.end();
      }
    });

  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: err.error || 'Error de validación',
        detail: err.detail || err.message,
      });
    }

    if (err.message.includes('unsupported image format') ||
        err.message.includes('Input buffer') ||
        err.message.includes('bad image') ||
        err.message.includes('excede')) {
      return res.status(400).json({
        error: 'No se pudo procesar la imagen.',
        detail: err.message,
      });
    }

    next(err);
  }
}

module.exports = { renderGrey };
